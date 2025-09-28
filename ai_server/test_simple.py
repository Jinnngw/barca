import requests
import json

# 简单测试API
url = "http://localhost:8000/v1/chat"
data = {
    "characterId": "einstein",
    "messages": [
        {"role": "user", "content": "你好"}
    ]
}

print("🧪 测试API...")
try:
    response = requests.post(url, json=data, timeout=10)
    print(f"状态码: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"回复: {result}")
    else:
        print(f"错误: {response.text}")
except Exception as e:
    print(f"请求失败: {e}")
