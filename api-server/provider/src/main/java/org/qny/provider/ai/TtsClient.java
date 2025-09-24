package org.qny.provider.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.checkerframework.checker.units.qual.A;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "ai-tts", url = "${ai.tts.base-url}")
public interface TtsClient {
    @PostMapping("/v1/tts")
    TtsResult tts(@RequestBody TtsRequest request);

    @Data
    @AllArgsConstructor
    class TtsRequest {
        private String text;
        private String voice;

        // Constructor, getters, and setters
    }

    @Data
    class TtsResult {
        private String audioUrl;

        // Constructor, getters, and setters
    }
}
