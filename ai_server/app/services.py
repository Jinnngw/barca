import os
from typing import AsyncGenerator, Protocol, Optional

from ai_server.app.support.persona import load_persona
from ai_server.app.support.prompt import build_prompt
from ai_server.app.vendors.mock_llm import MockLLM
from ai_server.app.vendors.openai_llm import OpenAILLM


class ChatService(Protocol):
    async def stream_chat(self, role: str, session_id: Optional[str], user_text: str) -> AsyncGenerator[str, None]:
        ...


class MockChatService:
    async def stream_chat(self, role: str, session_id: Optional[str], user_text: str):
        # Keep persona and instructions internal (system prompt), do not expose
        _persona = load_persona(role)
        # We intentionally do NOT include persona/instructions in the generated output
        # Simulate model response streaming based only on user input
        punctuation = set(" \t\n\r,.!?，。！？；：、")
        buffer = ""
        async for piece in MockLLM().stream_generate(user_text):
            for ch in piece:
                buffer += ch
                if ch in punctuation:
                    word = buffer.strip()
                    if word:
                        yield word
                    buffer = ""
        if buffer.strip():
            yield buffer.strip()


class OpenAIChatService:
    def __init__(self) -> None:
        self.client = OpenAILLM(
            api_key="sk-8b4e21c2efb5e8cc357dc1f3932dca4d644b79758d2a7bd2fe3d053ca809d5e2",
            model="qwen3-max",
            base_url="https://openai.qiniu.com/v1",
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
    provider = os.environ.get("AI_PROVIDER", "mock").lower()
    if provider == "openai":
        return OpenAIChatService()
    return MockChatService()


