package org.qny.provider.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "ai-asr", url = "${ai.asr.base-url}")
public interface AsrClient {
    @PostMapping("/v1/asr")
    AsrResult asr(@RequestBody AsrRequest request);

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    class AsrRequest {
        private String audioData;  // Base64 字符串
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    class AsrResult {
        private String text;
        private String audioUrl;
    }
}
