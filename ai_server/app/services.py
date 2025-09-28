import os
from typing import AsyncGenerator, Protocol, Optional

from app.support.persona import load_persona
from app.support.prompt import build_prompt
from app.vendors.openai_llm import OpenAILLM
from app.vendors.mock_llm import MockLLM
import config


class ChatService(Protocol):
    async def stream_chat(self, role: str, session_id: Optional[str], user_text: str) -> AsyncGenerator[str, None]:
        ...


class MockChatService:
    async def stream_chat(self, role: str, session_id: Optional[str], user_text: str):
        # 直接使用MockLLM，简化逻辑
        punctuation = set(" \t\n\r,.!?，。！？；：、")
        buffer = ""
        
        # 使用MockLLM
        async for piece in MockLLM().stream_generate(user_text, role):
            buffer += piece
            if piece in punctuation:
                word = buffer.strip()
                if word:
                    yield word
                buffer = ""
        if buffer.strip():
            yield buffer.strip()


class OpenAIChatService:
    def __init__(self) -> None:
        # 使用七牛云的 OpenAI 兼容 API 服务
        self.client = OpenAILLM(
            api_key=config.OPENAI_API_KEY,
            model=config.OPENAI_MODEL,
            base_url=config.OPENAI_BASE_URL,
        )

    async def stream_chat(self, role: str, session_id: Optional[str], user_text: str):
        persona = load_persona(role)
        # Build a system prompt containing persona and instructions only
        system_full = build_prompt(persona, "")
        # Strip conversation section if present to avoid leaking scaffolding
        system_only = system_full.split("# Conversation", 1)[0].strip()

        punctuation = set(" \t\n\r,.!?，。！？；：、")
        buffer = ""
        # Stream assistant deltas only, chunk by word/punctuation
        async for delta in self.client.chat_stream(system=system_only, user=user_text):
            for ch in delta:
                buffer += ch
                if ch in punctuation:
                    word = buffer.strip()
                    if word:
                        yield word
                    buffer = ""
        if buffer.strip():
            yield buffer.strip()


def get_chat_service() -> ChatService:
    provider = os.environ.get("AI_PROVIDER", "openai").lower()
    if provider == "openai":
        return OpenAIChatService()
    return MockChatService()


