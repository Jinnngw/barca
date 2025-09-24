package org.qny.provider.ai;

import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@FeignClient(name = "ai-asr", url = "${ai.asr.base-url}")
public interface AsrClient {
    @PostMapping("/v1/asr")
    AsrResult asr(@RequestPart("audio") MultipartFile audio);

    @Data
    class AsrResult {
        private String text;

        // Constructor, getters, and setters
    }
}
