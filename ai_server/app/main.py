import os
import json
from typing import AsyncGenerator, Dict, Optional, List, Literal
from io import BytesIO

from fastapi import FastAPI, Request, Query
from fastapi.responses import JSONResponse, StreamingResponse
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel

from ai_server.app.services import get_chat_service

app = FastAPI(title="AI Server (FastAPI)")

# ---- Request models ----
class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class ChatRequest(BaseModel):
    characterId: str
    messages: List[ChatMessage]


@app.post("/api/chat/stream")
async def chat_stream(
    payload: ChatRequest,
    sessionId: Optional[str] = Query(None),
) -> EventSourceResponse:
    # characterId 替代原来的 role
    role = payload.characterId
    # 取最后一条 user 消息作为当前输入
    user_text = ""
    for m in reversed(payload.messages):
        if m.role == "user":
            user_text = m.content
            break

    service = get_chat_service()

    async def event_generator() -> AsyncGenerator[dict, None]:
        buffer = ""
        punctuation = set(" \t\n\r,.!?，。！？；：、")
        async for token in service.stream_chat(role, sessionId, user_text):
            buffer += token
            if token in punctuation:
                word = buffer.strip()
                if word:
                    yield {"event": "message", "data": word}
                buffer = ""
        if buffer.strip():
            yield {"event": "message", "data": buffer.strip()}

    return EventSourceResponse(event_generator())

@app.post("/api/chat")
async def chat_once(payload: ChatRequest, sessionId: Optional[str] = Query(None)) -> JSONResponse:
    role = payload.characterId
    user_text = ""
    for m in reversed(payload.messages):
        if m.role == "user":
            user_text = m.content
            break

    service = get_chat_service()
    # 累积生成内容（
    result_chunks: List[str] = []
    async for token in service.stream_chat(role, sessionId, user_text):
        result_chunks.append(token)
    text = "".join(result_chunks).strip()
    return JSONResponse({"text": text})


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok"}


# -----------------------------
# Placeholder APIs for swagger
# -----------------------------

@app.post("/api/v1/sessions", tags=["sessions"], summary="Create a chat session")
async def create_session(
    characterId: str = Query(..., description="Character ID, e.g. harry"),
) -> Dict[str, str]:
    session_id = f"sess_{characterId}_demo"
    return {"sessionId": session_id, "characterId": characterId}


@app.post(
    "/api/v1/sessions/{sessionId}/messages",
    tags=["sessions"],
    summary="Send a message (JSON text or audio upload)",
)
async def send_message(sessionId: str, request: Request) -> JSONResponse:
    content_type = request.headers.get("content-type", "").lower()

    if "application/json" in content_type:
        body = await request.json()
        text = str(body.get("text", ""))
        return JSONResponse(
            {
                "sessionId": sessionId,
                "messageId": "msg_demo",
                "type": "text",
                "text": text,
            }
        )

    # Assume multipart/form-data for audio upload or form text
    form = await request.form()
    audio = form.get("audio")  # type: ignore[assignment]
    text = form.get("text")
    audio_size = 0
    if hasattr(audio, "read"):
        data = await audio.read()  # type: ignore[attr-defined]
        audio_size = len(data)

    return JSONResponse(
        {
            "sessionId": sessionId,
            "messageId": "msg_demo",
            "type": "audio" if audio else "text",
            "text": text or "",
            "audioBytes": audio_size,
        }
    )


@app.post("/api/v1/media/asr", tags=["media"], summary="Upload audio and get text")
async def asr(request: Request) -> Dict[str, str]:
    form = await request.form()
    _audio = form.get("audio")
    # Placeholder transcript
    return {"text": "This is a placeholder transcript."}


@app.post("/api/v1/media/tts", tags=["media"], summary="Upload text and get audio")
async def tts(request: Request) -> StreamingResponse:
    # Accept JSON or form
    content_type = request.headers.get("content-type", "").lower()
    text = ""
    if "application/json" in content_type:
        body = await request.json()
        text = str(body.get("text", ""))
    else:
        form = await request.form()
        text = str(form.get("text", ""))

    # Produce placeholder audio bytes
    dummy_audio = b"FAKEAUDIO"
    return StreamingResponse(
        BytesIO(dummy_audio),
        media_type="audio/mpeg",
        headers={"Content-Disposition": "attachment; filename=tts.mp3"},
    )
