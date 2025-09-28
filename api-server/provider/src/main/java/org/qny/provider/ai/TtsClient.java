package org.qny.provider.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "ai-tts", url = "${ai.tts.base-url}")
public interface TtsClient {
    @PostMapping("/v1/tts")
    TtsResult tts(@RequestBody TtsRequest request);

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    class TtsRequest {
        private String text;
        private String voice;

        // Constructor, getters, and setters
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    class TtsResult {
        private String audioData;  // Base64 编码的音频数据
        private String format;     // 音频格式，如 "mp3", "wav"
        private Integer duration;  // 音频时长（毫秒）
        
        // 兼容性：保留原来的 audioUrl 字段（可选）
        // private String audioUrl;
    }
}
