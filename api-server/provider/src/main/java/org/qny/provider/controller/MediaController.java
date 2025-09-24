package org.qny.provider.controller;

import lombok.RequiredArgsConstructor;
import org.qny.provider.ai.AsrClient;
import org.qny.provider.ai.TtsClient;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
public class MediaController {
    private final AsrClient asrClient;
    private final TtsClient ttsClient;

    @PostMapping("/asr")
    public AsrClient.AsrResult asr(@RequestPart("audio") MultipartFile audio) {
        return asrClient.asr(audio);
    }

    @PostMapping("/tts")
    public TtsClient.TtsResult tts(@RequestBody TtsClient.TtsRequest request) {
        return ttsClient.tts(request);
    }
}
