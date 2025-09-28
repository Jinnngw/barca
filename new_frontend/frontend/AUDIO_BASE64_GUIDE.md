# 音频文件转Base64功能使用说明

## 功能概述

系统已实现将音频文件转换为Base64字符串并发送给后端的功能，支持多种音频格式。

## 实现的功能

### 1. 音频文件转Base64
- 自动将录音文件转换为Base64字符串
- 支持多种音频格式：mp3, wav, ogg, m4a, aac, webm
- 自动检测音频格式

### 2. 发送格式
发送给后端的数据格式：
```json
{
  "audioData": "base64编码的音频数据...",
  "audioFormat": "mp3",
  "audioSize": 12345
}
```

## 接口调用

### 发送语音消息
```javascript
// 录音完成后自动调用
const response = await sessionAPI.sendAudioMessage(sessionId, audioBlob)
```

### 语音转文本
```javascript
// ASR功能
const response = await mediaAPI.speechToText(audioBlob)
```

## 支持的音频格式

| MIME类型 | 格式 | 说明 |
|---------|------|------|
| audio/mpeg | mp3 | 最常用格式 |
| audio/wav | wav | 无损音频 |
| audio/ogg | ogg | 开源格式 |
| audio/mp4 | m4a | Apple格式 |
| audio/aac | aac | 高质量压缩 |
| audio/webm | webm | Web标准格式 |

## 处理流程

```
用户录音 → 生成音频Blob → 转换为Base64 → 检测格式 → 发送JSON到后端
```

## 测试功能

在聊天界面点击右上角的音频测试按钮可以：
1. 测试音频文件转Base64功能
2. 测试音频解码功能
3. 添加测试消息到聊天中

## 后端接口要求

后端需要接收以下格式的数据：

### POST /api/v1/sessions/{sessionId}/audio
```json
{
  "audioData": "base64字符串",
  "audioFormat": "mp3",
  "audioSize": 12345
}
```

### POST /api/v1/media/asr
```json
{
  "audioData": "base64字符串",
  "audioFormat": "mp3",
  "audioSize": 12345
}
```

## 错误处理

- 自动重试机制（最多3次）
- 详细的错误日志
- 友好的错误提示

## 性能优化

- Base64转换使用FileReader API
- 自动格式检测避免手动指定
- 错误重试机制提高成功率

## 调试信息

打开浏览器控制台可以看到：
- 音频文件转换过程
- Base64数据长度
- 格式检测结果
- 发送状态和响应
