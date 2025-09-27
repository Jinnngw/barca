from __future__ import annotations

import asyncio
import json
import logging
from typing import AsyncGenerator

import httpx


class OpenAILLM:
    def __init__(self, api_key: str, model: str, base_url: str = "https://api.openai.com/v1") -> None:
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.logger = logging.getLogger(__name__)

    def _get_base_headers(self) -> dict[str, str]:
        """Return ASCII-only headers for OpenAI API requests."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "ai-server/0.1",
        }

    def _sanitize_headers(self, headers: dict[str, str]) -> dict[str, str]:
        """Return a copy of headers with ASCII-only keys/values.
        Non-ASCII characters are removed to avoid httpx UnicodeEncodeError.
        """
        new_headers: dict[str, str] = {}
        for k, v in (headers or {}).items():
            ks = str(k)
            vs = str(v)
            # keep only ASCII characters
            ks_ascii = ks.encode("ascii", errors="ignore").decode("ascii")
            vs_ascii = vs.encode("ascii", errors="ignore").decode("ascii")
            # skip empty keys (should not happen) and keep values as ASCII
            if ks_ascii:
                new_headers[ks_ascii] = vs_ascii
        return new_headers

    async def chat_stream(self, *, system: str, user: str) -> AsyncGenerator[str, None]:
        url = f"{self.base_url}/chat/completions"
        headers = self._sanitize_headers(self._get_base_headers())
        payload = {
            "model": self.model,
            "stream": True,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        }

        # Debug log headers to ensure no Chinese characters
        self.logger.debug(f"Request headers: {headers}")

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

