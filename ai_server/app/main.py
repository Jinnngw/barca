import os
import json
import uuid
import base64
from typing import AsyncGenerator, Dict, Optional, List, Literal
from io import BytesIO

import httpx
from fastapi import FastAPI, Request, Query, Path, Form, File, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel

from app.services import get_chat_service

app = FastAPI(title="AI Server (FastAPI)")

# ---- Global session storage ----
SESSIONS: Dict[str, Dict] = {}

# ---- Request models ----
class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class ChatRequest(BaseModel):
    characterId: str
    messages: List[ChatMessage]

class TextMessageRequest(BaseModel):
    text: str

class TTSRequest(BaseModel):
    text: str

class ChatResponse(BaseModel):
    text: str

# 新的 TTS 接口数据模型
class TtsRequest(BaseModel):
    text: str
    voice: str

class TtsResult(BaseModel):
    audioData: str  # Base64 编码的音频数据
    format: str     # 音频格式，如 "mp3", "wav"
    duration: int   # 音频时长（毫秒）


# ---- V1 API Endpoints ----

@app.post("/api/v1/sessions", tags=["sessions"], summary="Create a new chat session")
async def create_session(
    characterId: str = Query(..., description="Character ID, e.g. harry"),
) -> Dict[str, str]:
    session_id = str(uuid.uuid4())
    SESSIONS[session_id] = {
        "characterId": characterId,
        "history": []
    }
    return {"sessionId": session_id, "characterId": characterId}


@app.post("/api/v1/sessions/{sessionId}/messages", tags=["sessions"], summary="Send a text message")
async def send_message(
    sessionId: str = Path(..., description="Session ID"),
    body: TextMessageRequest = None,
    request: Request = None,
    stream: Optional[bool] = Query(False, description="Enable streaming"),
) -> JSONResponse:
    # Check if session exists
    if sessionId not in SESSIONS:
        return JSONResponse({"error": "Session not found"}, status_code=404)
    
    # Check for streaming via query param or Accept header
    accept_header = request.headers.get("accept", "").lower()
    is_streaming = stream or "text/event-stream" in accept_header
    
    # Use Pydantic model if available, otherwise fallback to manual parsing
    if body and body.text:
        text = body.text
    else:
        # Fallback parsing for non-JSON requests
        content_type = request.headers.get("content-type", "").lower()
        if "application/json" in content_type:
            body_dict = await request.json()
            text = body_dict.get("text", "")
        else:
            form = await request.form()
            text = form.get("text", "")
    
    if not text:
        return JSONResponse({"error": "No text provided"}, status_code=400)
    
    # Add user message to history
    session = SESSIONS[sessionId]
    session["history"].append({"role": "user", "content": text})
    
    service = get_chat_service()
    character_id = session["characterId"]
    
    if is_streaming:
        # Streaming response
        async def event_generator() -> AsyncGenerator[dict, None]:
            buffer = ""
            punctuation = set(" \t\n\r,.!?，。！？；：、")
            async for token in service.stream_chat(character_id, sessionId, text):
                buffer += token
                if token in punctuation:
                    word = buffer.strip()
                    if word:
                        yield {"event": "message", "data": word}
                    buffer = ""
            if buffer.strip():
                yield {"event": "message", "data": buffer.strip()}
        
        return EventSourceResponse(event_generator())
    else:
        # Non-streaming response
        result_chunks: List[str] = []
        async for token in service.stream_chat(character_id, sessionId, text):
            result_chunks.append(token)
        ai_response = "".join(result_chunks).strip()
        
        # Add AI response to history
        session["history"].append({"role": "assistant", "content": ai_response})
        
        return JSONResponse({"text": ai_response})


@app.post("/v1/chat", tags=["chat"], summary="Chat with AI character")
async def chat(
    request: ChatRequest,
) -> ChatResponse:
    """
    Chat interface for external services to call via Feign.
    Uses characterId and messages directly without session management.
    """
    # Extract the last user message from the messages list
    if not request.messages:
        return ChatResponse(text="No messages provided")
    
    # Get the last user message
    last_message = None
    for msg in reversed(request.messages):
        if msg.role == "user":
            last_message = msg.content
            break
    
    if not last_message:
        return ChatResponse(text="No user message found")
    
    # Use the chat service with characterId directly
    service = get_chat_service()
    
    # Generate AI response
    result_chunks: List[str] = []
    async for token in service.stream_chat(request.characterId, None, last_message):
        result_chunks.append(token)
    ai_response = "".join(result_chunks).strip()
    
    return ChatResponse(text=ai_response)



@app.post("/api/v1/sessions/{sessionId}/audio", tags=["sessions"], summary="Send an audio message")
async def send_audio(
    sessionId: str = Path(..., description="Session ID"),
    audio: UploadFile = File(..., description="Audio file"),
) -> JSONResponse:
    # Check if session exists
    if sessionId not in SESSIONS:
        return JSONResponse({"error": "Session not found"}, status_code=404)
    
    # Read audio file size
    audio_data = await audio.read()
    audio_size = len(audio_data)
    
    # Generate message ID
    message_id = str(uuid.uuid4())
    
    return JSONResponse({
        "sessionId": sessionId,
        "messageId": message_id,
        "type": "audio",
        "audioBytes": audio_size,
    })


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok"}


# ---- Media Endpoints ----

@app.post("/api/v1/media/asr", tags=["media"], summary="Upload audio and get text")
async def asr(
    audio: UploadFile = File(..., description="Audio file"),
) -> Dict[str, str]:
    # Read audio file (placeholder implementation)
    audio_data = await audio.read()
    audio_size = len(audio_data)
    
    # Placeholder transcript
    return {"text": f"This is a placeholder transcript for {audio_size} bytes of audio."}


@app.post("/api/v1/media/tts", tags=["media"], summary="Upload text and get audio")
async def tts(
        body: TTSRequest = None,
        request: Request = None,
) -> StreamingResponse:
    # Use Pydantic model if available, otherwise fallback to manual parsing
    if body and body.text:
        text = body.text
    else:
        # Fallback parsing for non-JSON requests
        content_type = request.headers.get("content-type", "").lower()
        if "application/json" in content_type:
            body_dict = await request.json()
            text = str(body_dict.get("text", ""))
        else:
            form = await request.form()
            text = str(form.get("text", ""))

    if not text:
        return JSONResponse({"error": "No text provided"}, status_code=400)

    api_key = os.environ.get("QINIU_API_KEY", "sk-8b4e21c2efb5e8cc357dc1f3932dca4d644b79758d2a7bd2fe3d053ca809d5e2")

    try:
        # Call Qiniu Cloud TTS API
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://openai.qiniu.com/v1/voice/tts",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "text": text,
                    "voice_type": "zh-CN-XiaoxiaoNeural",
                    "encoding": "mp3",
                    "speed_ratio": 1.0
                }
            )
            response.raise_for_status()

            # Return the audio stream
            return StreamingResponse(
                BytesIO(response.content),
                media_type="audio/mpeg",
                headers={"Content-Disposition": "attachment; filename=tts.mp3"},
            )

    except httpx.HTTPStatusError as e:
        return JSONResponse(
            {"error": f"TTS API error: {e.response.status_code} - {e.response.text}"},
            status_code=e.response.status_code
        )
    except httpx.RequestError as e:
        return JSONResponse(
            {"error": f"TTS request error: {str(e)}"},
            status_code=500
        )
    except Exception as e:
        return JSONResponse(
            {"error": f"TTS processing error: {str(e)}"},
            status_code=500
        )