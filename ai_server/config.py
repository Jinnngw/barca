import os

# 七牛云 OpenAI 兼容 API 配置
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "sk-8b4e21c2efb5e8cc357dc1f3932dca4d644b79758d2a7bd2fe3d053ca809d5e2")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "qwen3-max") 
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://openai.qiniu.com/v1")

# 七牛云 TTS 配置
QINIU_API_KEY = os.getenv("QINIU_API_KEY", "sk-8b4e21c2efb5e8cc357dc1f3932dca4d644b79758d2a7bd2fe3d053ca809d5e2")
QINIU_TTS_URL = os.getenv("QINIU_TTS_URL", "https://openai.qiniu.com/v1/voice/tts")

# 七牛云对象存储配置（用于 ASR 音频文件上传）
QINIU_ACCESS_KEY = os.getenv("QINIU_ACCESS_KEY", "MxhljuBGXaJPHPs8e1eJd5Z9oX1RyWlpbig8bfQi")
QINIU_SECRET_KEY = os.getenv("QINIU_SECRET_KEY", "gqwFfaqB8YeJuqk2iQCIvoP2A1YhL3Orirb7yW3i")
QINIU_BUCKET_NAME = os.getenv("QINIU_BUCKET_NAME", "braca-ars-audio")
QINIU_DOMAIN = os.getenv("QINIU_DOMAIN", "t3aicvv9s.hn-bkt.clouddn.com")
