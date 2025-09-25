from __future__ import annotations

import asyncio
import json
from typing import AsyncGenerator

import httpx


class OpenAILLM:
    def __init__(self, api_key: str, model: str, base_url: str = "https://api.openai.com/v1") -> None:
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")

    async def chat_stream(self, *, system: str, user: str) -> AsyncGenerator[str, None]:
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "stream": True,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        }

        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line or not line.startswith("data:"):
                        continue
                    if line.strip() == "data: [DONE]":
                        break
                    try:
                        data = json.loads(line[len("data:"):].strip())
                        delta = data["choices"][0]["delta"].get("content", "")
                        if delta:
                            yield delta
                    except Exception:
                        continue


