package org.qny.provider.ai;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@FeignClient(name = "ai-chat", url = "${ai.chat.base-url}")
public interface ChatClient {
    @PostMapping("/v1/chat")
    ChatResponse chat(@RequestBody ChatRequest request);

    @Data
    @AllArgsConstructor
    class ChatRequest {
        private String characterId;
        private List<Message> messages;

        // Getters and setters
    }

    @Data
    @AllArgsConstructor
    class Message {
        private String role;
        private String content;

        // Constructor, getters, and setters
    }

    @Data
    class ChatResponse {
        private String text;

        // Constructor, getters, and setters
    }
}
