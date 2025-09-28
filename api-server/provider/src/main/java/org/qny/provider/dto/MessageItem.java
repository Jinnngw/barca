package org.qny.provider.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MessageItem {
    private String id;
    private String role; // user / assistant / system
    private String text;
    private String audioUrl; // optional - 兼容性保留
    private String audioData; // Base64 编码的音频数据
    private String audioFormat; // 音频格式，如 "mp3", "wav"
    private Integer audioDuration; // 音频时长（毫秒）
    private Instant time;
}
