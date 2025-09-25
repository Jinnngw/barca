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
        persona = load_persona(role)
        prompt = build_prompt(persona, user_text)
        async for token in MockLLM().stream_generate(prompt):
            yield token


class OpenAIChatService:
    def __init__(self) -> None:
        self.client = OpenAILLM(
            api_key=os.environ.get("OPENAI_API_KEY", ""),
            model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
            base_url=os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1"),
        )

    async def stream_chat(self, role: str, session_id: Optional[str], user_text: str):
        persona = load_persona(role)
        system = persona
        user = user_text
        async for token in self.client.chat_stream(system=system, user=user):
            yield token


def get_chat_service() -> ChatService:
    provider = os.environ.get("AI_PROVIDER", "mock").lower()
    if provider == "openai":
        return OpenAIChatService()
    return MockChatService()


