import os
import json
from typing import AsyncGenerator, Dict, Optional

from fastapi import FastAPI, Request, Query
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

from ai_server.app.services import get_chat_service

app = FastAPI(title="AI Server (FastAPI)")


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat/stream")
async def chat_stream(
    request: Request,
    role: str = Query("default"),
    sessionId: Optional[str] = Query(None),
) -> EventSourceResponse:
    body = await request.json()
    user_text = str(body.get("text", ""))

    service = get_chat_service()

    async def event_generator() -> AsyncGenerator[dict, None]:
        async for token in service.stream_chat(role, sessionId, user_text):
            yield {"event": "message", "data": token}

    return EventSourceResponse(event_generator())


