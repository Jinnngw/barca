import os
import json
import uuid
import base64
from datetime import datetime
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

# ASR接口数据模型
class AsrRequest(BaseModel):
    audioData: str  # Base64 编码的音频数据

class AsrResult(BaseModel):
    text: str  # 识别出的文本


# ---- V1 API Endpoints ----

# @app.post("/api/v1/sessions", tags=["sessions"], summary="Create a new chat session")
# async def create_session(
#     characterId: str = Query(..., description="Character ID, e.g. harry"),
# ) -> Dict[str, str]:
#     session_id = str(uuid.uuid4())
#     SESSIONS[session_id] = {
#         "characterId": characterId,
#         "history": []
#     }
#     return {"sessionId": session_id, "characterId": characterId}


# @app.post("/api/v1/sessions/{sessionId}/messages", tags=["sessions"], summary="Send a text message")
# async def send_message(
#     sessionId: str = Path(..., description="Session ID"),
#     body: TextMessageRequest = None,
#     request: Request = None,
#     stream: Optional[bool] = Query(False, description="Enable streaming"),
# ) -> JSONResponse:
#     # Check if session exists
#     if sessionId not in SESSIONS:
#         return JSONResponse({"error": "Session not found"}, status_code=404)
    
#     # Check for streaming via query param or Accept header
#     accept_header = request.headers.get("accept", "").lower()
#     is_streaming = stream or "text/event-stream" in accept_header
    
#     # Use Pydantic model if available, otherwise fallback to manual parsing
#     if body and body.text:
#         text = body.text
#     else:
#         # Fallback parsing for non-JSON requests
#         content_type = request.headers.get("content-type", "").lower()
#         if "application/json" in content_type:
#             body_dict = await request.json()
#             text = body_dict.get("text", "")
#         else:
#             form = await request.form()
#             text = form.get("text", "")
    
#     if not text:
#         return JSONResponse({"error": "No text provided"}, status_code=400)
    
#     # Add user message to history
#     session = SESSIONS[sessionId]
#     session["history"].append({"role": "user", "content": text})
    
#     service = get_chat_service()
#     character_id = session["characterId"]
    
#     if is_streaming:
#         # Streaming response
#         async def event_generator() -> AsyncGenerator[dict, None]:
#             buffer = ""
#             punctuation = set(" \t\n\r,.!?，。！？；：、")
#             async for token in service.stream_chat(character_id, sessionId, text):
#                 buffer += token
#                 if token in punctuation:
#                     word = buffer.strip()
#                     if word:
#                         yield {"event": "message", "data": word}
#                     buffer = ""
#             if buffer.strip():
#                 yield {"event": "message", "data": buffer.strip()}
        
#         return EventSourceResponse(event_generator())
#     else:
#         # Non-streaming response
#         result_chunks: List[str] = []
#         async for token in service.stream_chat(character_id, sessionId, text):
#             result_chunks.append(token)
#         ai_response = "".join(result_chunks).strip()
        
#         # Add AI response to history
#         session["history"].append({"role": "assistant", "content": ai_response})
        
#         return JSONResponse({"text": ai_response})


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


@app.post("/v1/tts", tags=["media"], summary="Upload text and get audio")
async def tts(
    request: TtsRequest,
) -> TtsResult:
    """
    TTS interface for external services to call via Feign.
    Converts text to speech using Qiniu Cloud TTS service.
    """
    try:
        # 人物语音映射和风格 - 使用七牛云不同的音色
        voice_mapping = {
            "harrypotter": {
                "voice_type": "qiniu_zh_female_wwxkjx",
                "spkid": 11,  # 精品男声，男孩，活泼开朗 - 适合年轻的哈利波特
                "speed_ratio": 1.1,
                "style_prefix": "作为哈利·波特，我用年轻而勇敢的语气说："
            },
            "einstein": {
                "voice_type": "qiniu_zh_female_wwxkjx", 
                "spkid": 10,  # 精品男声，成熟正式，播音腔 - 适合深思熟虑的爱因斯坦
                "speed_ratio": 0.9,
                "style_prefix": "作为爱因斯坦，我用深思熟虑的语调说："
            },
            "confucius": {
                "voice_type": "qiniu_zh_female_wwxkjx",
                "spkid": 13,  # 精品男声，央视新闻播音腔 - 适合庄重的孔子
                "speed_ratio": 0.8,
                "style_prefix": "作为孔子，我用庄重而智慧的语调说："
            },
            "socrates": {
                "voice_type": "qiniu_zh_female_wwxkjx",
                "spkid": 12,  # 精品男声，常见解说配音腔 - 适合思辨的苏格拉底
                "speed_ratio": 0.9,
                "style_prefix": "作为苏格拉底，我用质疑和思辨的语调说："
            },
            "shakespeare": {
                "voice_type": "qiniu_zh_female_wwxkjx",
                "spkid": 7,   # 精品女声，成熟，声音柔和纯美 - 适合戏剧性的莎士比亚
                "speed_ratio": 1.0,
                "style_prefix": "作为莎士比亚，我用戏剧性的语调说："
            },
            "marie-curie": {
                "voice_type": "qiniu_zh_female_wwxkjx",
                "spkid": 14,  # 精品女声，少女音色 - 适合坚定的居里夫人
                "speed_ratio": 1.0,
                "style_prefix": "作为居里夫人，我用坚定而科学的语调说："
            },
            "default": {
                "voice_type": "qiniu_zh_female_wwxkjx",
                "spkid": 7,   # 默认使用精品女声
                "speed_ratio": 1.0,
                "style_prefix": ""
            }
        }
        
        # 获取对应的人物配置
        character_config = voice_mapping.get(request.voice.lower(), voice_mapping["default"])
        voice_type = character_config["voice_type"]
        spkid = character_config["spkid"]
        speed_ratio = character_config["speed_ratio"]
        style_prefix = character_config["style_prefix"]
        
        # 构建带风格的文本
        styled_text = f"{style_prefix}{request.text}" if style_prefix else request.text
        
        print(f"TTS Request: text='{styled_text}', voice='{request.voice}', voice_type='{voice_type}', spkid={spkid}, speed={speed_ratio}")
        
        # 调用七牛云 TTS 服务
        api_key = os.environ.get("QINIU_API_KEY", "sk-8b4e21c2efb5e8cc357dc1f3932dca4d644b79758d2a7bd2fe3d053ca809d5e2")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://openai.qiniu.com/v1/voice/tts",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "audio": {
                        "voice_type": voice_type,
                        "spkid": spkid,
                        "encoding": "mp3",
                        "speed_ratio": speed_ratio
                    },
                    "request": {
                        "text": styled_text
                    }
                }
            )
            response.raise_for_status()
            
            # 解析响应
            response_data = response.json()
            print(f"TTS Response: {response_data}")
            
            # 获取音频数据
            audio_data_base64 = response_data.get("data", "")
            duration_str = response_data.get("addition", {}).get("duration", "0")
            
            # 检查音频数据是否有效
            if not audio_data_base64:
                print("Warning: 音频数据为空")
                return TtsResult(
                    audioData="",
                    format="mp3", 
                    duration=0
                )
            
            # 检查 Base64 数据是否包含重复的填充字符
            if audio_data_base64.count('A') > len(audio_data_base64) * 0.8:
                print("Warning: 检测到异常的 Base64 数据（包含过多重复字符）")
                # 尝试清理数据
                audio_data_base64 = audio_data_base64.rstrip('A')
                if not audio_data_base64:
                    print("Error: 清理后音频数据为空")
                    return TtsResult(
                        audioData="",
                        format="mp3",
                        duration=0
                    )
            
            # 转换时长为整数
            try:
                duration = int(duration_str)
            except (ValueError, TypeError):
                duration = len(request.text) * 100  # 估算时长
            
            print(f"Audio data length: {len(audio_data_base64)}")
            print(f"Duration: {duration}")
            
            return TtsResult(
                audioData=audio_data_base64,
                format="mp3",
                duration=duration
            )
            
    except httpx.HTTPStatusError as e:
        # HTTP 错误处理
        print(f"HTTP Error: {e.response.status_code} - {e.response.text}")
        return TtsResult(
            audioData="",  # 错误时返回空数据
            format="mp3",
            duration=0
        )
    except Exception as e:
        # 其他错误处理
        print(f"TTS Error: {str(e)}")
        return TtsResult(
            audioData="",  # 错误时返回空数据
            format="mp3",
            duration=0
        )


# @app.post("/api/v1/sessions/{sessionId}/audio", tags=["sessions"], summary="Send an audio message")
# async def send_audio(
#     sessionId: str = Path(..., description="Session ID"),
#     audio: UploadFile = File(..., description="Audio file"),
# ) -> JSONResponse:
#     # Check if session exists
#     if sessionId not in SESSIONS:
#         return JSONResponse({"error": "Session not found"}, status_code=404)
    
#     # Read audio file size
#     audio_data = await audio.read()
#     audio_size = len(audio_data)
    
#     # Generate message ID
#     message_id = str(uuid.uuid4())
    
#     return JSONResponse({
#         "sessionId": sessionId,
#         "messageId": message_id,
#         "type": "audio",
#         "audioBytes": audio_size,
#     })


# @app.get("/health")
# async def health() -> Dict[str, str]:
#     return {"status": "ok"}


# ---- Media Endpoints ----

@app.post("/v1/asr", tags=["media"], summary="Upload audio and get text")
async def asr(
    request: AsrRequest,
) -> AsrResult:
    """
    ASR interface for external services to call via Feign.
    Converts audio to text using Qiniu Cloud ASR service.
    Accepts Base64 encoded audio data.
    """
    try:
        # 解码 Base64 音频数据
        try:
            audio_data = base64.b64decode(request.audioData)
        except Exception as e:
            print(f"Base64 decode error: {str(e)}")
            return AsrResult(text="")
        
        print(f"ASR Request: size={len(audio_data)} bytes")
        print(f"Base64 data length: {len(request.audioData)} characters")
        print(f"Base64 data preview: {request.audioData[:50]}...")
        
        # 调用七牛云 ASR 服务
        api_key = os.environ.get("QINIU_API_KEY", "sk-8b4e21c2efb5e8cc357dc1f3932dca4d644b79758d2a7bd2fe3d053ca809d5e2")
        
        print(f"API Key: {api_key[:20]}...")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("Sending request to Qiniu ASR API...")
            response = await client.post(
                "https://openai.qiniu.com/v1/voice/asr",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "asr",
                    "audioBase64": request.audioData,  # 使用 audioBase64 参数
                    "format": "mp3"
                }
            )
            print(f"Response status: {response.status_code}")
            print(f"Response headers: {dict(response.headers)}")
            
            response.raise_for_status()
            
            # 解析响应
            response_data = response.json()
            print(f"Full response: {response_data}")
            
            recognized_text = response_data.get("data", {}).get("result", {}).get("text", "")
            
            print(f"ASR Result: '{recognized_text}'")
            return AsrResult(text=recognized_text)
            
    except httpx.HTTPStatusError as e:
        # HTTP 错误处理
        print(f"ASR HTTP Error: {e.response.status_code} - {e.response.text}")
        return AsrResult(text="")  # 错误时返回空文本
    except Exception as e:
        # 其他错误处理
        print(f"ASR Error: {str(e)}")
        return AsrResult(text="")  # 错误时返回空文本


# @app.post("/v1/tts", tags=["media"], summary="Upload text and get audio")
# async def tts_old(
#     body: TTSRequest = None,
#     request: Request = None,
# ) -> StreamingResponse:
#     # Use Pydantic model if available, otherwise fallback to manual parsing
#     if body and body.text:
#         text = body.text
#     else:
#         # Fallback parsing for non-JSON requests
#         content_type = request.headers.get("content-type", "").lower()
#         if "application/json" in content_type:
#             body_dict = await request.json()
#             text = str(body_dict.get("text", ""))
#         else:
#             form = await request.form()
#             text = str(form.get("text", ""))

#     if not text:
#         return JSONResponse({"error": "No text provided"}, status_code=400)

#     api_key = os.environ.get("QINIU_API_KEY", "sk-8b4e21c2efb5e8cc357dc1f3932dca4d644b79758d2a7bd2fe3d053ca809d5e2")

#     try:
#         # Call Qiniu Cloud TTS API
#         async with httpx.AsyncClient(timeout=30.0) as client:
#             response = await client.post(
#                 "https://openai.qiniu.com/v1/voice/tts",
#                 headers={
#                     "Authorization": f"Bearer {api_key}",
#                     "Content-Type": "application/json"
#                 },
#                 json={
#                     "text": text,
#                     "voice_type": "zh-CN-XiaoxiaoNeural",
#                     "encoding": "mp3",
#                     "speed_ratio": 1.0
#                 }
#             )
#             response.raise_for_status()

#             # Return the audio stream
#             return StreamingResponse(
#                 BytesIO(response.content),
#                 media_type="audio/mpeg",
#                 headers={"Content-Disposition": "attachment; filename=tts.mp3"},
#             )

#     except httpx.HTTPStatusError as e:
#         return JSONResponse(
#             {"error": f"TTS API error: {e.response.status_code} - {e.response.text}"},
#             status_code=e.response.status_code
#         )
#     except httpx.RequestError as e:
#         return JSONResponse(
#             {"error": f"TTS request error: {str(e)}"},
#             status_code=500
#         )
#     except Exception as e:
#         return JSONResponse(
#             {"error": f"TTS processing error: {str(e)}"},
#             status_code=500
#         )
