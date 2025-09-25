import asyncio
from typing import AsyncGenerator


class MockLLM:
    async def stream_generate(self, text: str) -> AsyncGenerator[str, None]:
        # naive tokenization by char
        for ch in text:
            yield ch
            await asyncio.sleep(0.005)


