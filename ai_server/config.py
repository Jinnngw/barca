import os

# 七牛云 OpenAI 兼容 API 配置
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "sk-8b4e21c2efb5e8cc357dc1f3932dca4d644b79758d2a7bd2fe3d053ca809d5e2")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "qwen3-max") 
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://openai.qiniu.com/v1")
