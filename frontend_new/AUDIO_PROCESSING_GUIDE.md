# Base64 音频数据处理使用说明

## 功能概述

本系统已完整实现 base64 音频数据的解码和播放功能，可以处理从后端接口返回的音频数据。

## 接口数据格式

后端接口应返回以下格式的数据：

```json
{
  "assistantMessage": {
    "id": "ai-123",
    "text": "你好！这是一条语音消息",
    "time": "2024-01-01T12:00:00Z",
    "audioData": "base64编码的音频数据...",
    "audioFormat": "mp3",
    "audioDuration": 3.5
  }
}
```

## 支持的音频格式

- **mp3** - 最常用格式
- **wav** - 无损音频
- **ogg** - 开源格式
- **m4a** - Apple格式
- **aac** - 高质量压缩
- **webm** - Web标准格式

## 使用方法

### 1. 自动处理

当后端返回包含 `audioData` 字段的消息时，系统会自动：

1. 检测音频数据
2. 根据 `audioFormat` 确定格式
3. 解码 base64 数据
4. 提供播放按钮

### 2. 手动处理

```javascript
import { audioDecoder } from './utils/audioDecoder'

// 解码音频
const audioUrl = await audioDecoder.decodeBase64Audio(
  base64Data,    // base64音频数据
  'mp3',         // 音频格式
  'cache-key'    // 缓存键（可选）
)

// 播放音频
const audio = await audioDecoder.playBase64Audio(
  base64Data,
  'mp3',
  { volume: 1.0 }  // 播放选项
)
```

### 3. 测试功能

在聊天界面中，点击右上角的音频测试按钮可以：

1. 测试音频解码功能
2. 添加测试音频消息
3. 验证播放功能

## 技术实现

### 核心组件

1. **AudioDecoder** (`audioDecoder.js`)
   - 负责 base64 解码
   - 格式验证和转换
   - 缓存管理

2. **VoiceChatManager** (`voiceChat.js`)
   - 集成音频播放
   - 音量控制
   - 错误处理

3. **Chat组件** (`Chat.vue`)
   - 用户界面
   - 消息处理
   - 播放控制

### 处理流程

```
接口返回 → 检测audioData → 解码base64 → 创建音频URL → 播放
```

## 注意事项

1. **数据大小**: base64 编码会增加约33%的数据大小
2. **浏览器兼容**: 不同浏览器对音频格式支持不同
3. **内存管理**: 系统会自动清理音频资源
4. **错误处理**: 包含完整的错误处理和降级机制

## 调试信息

打开浏览器控制台可以看到详细的处理日志：

- 音频解码过程
- 格式检测结果
- 播放状态
- 错误信息

## 示例代码

```javascript
// 处理接口返回的音频消息
const message = {
  audioData: "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
  audioFormat: "wav",
  text: "测试音频"
}

// 播放音频
await voiceChatManager.playBase64Audio(
  message.audioData,
  message.audioFormat,
  { volume: 0.8 }
)
```

## 故障排除

1. **音频无法播放**: 检查 base64 数据是否完整
2. **格式不支持**: 确认 `audioFormat` 字段正确
3. **解码失败**: 验证 base64 数据格式
4. **播放卡顿**: 检查音频文件大小和网络状况
