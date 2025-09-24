package org.qny.provider.controller;

import lombok.RequiredArgsConstructor;
import org.qny.provider.ai.AsrClient;
import org.qny.provider.ai.ChatClient;
import org.qny.provider.ai.TtsClient;
import org.qny.provider.core.MemoryRepo;
import org.qny.provider.dto.MessageItem;
import org.qny.provider.dto.SendMessageResponse;
import org.qny.provider.dto.SendTextRequest;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/sessions")
@RequiredArgsConstructor
public class SessionController {
    private final MemoryRepo repo;
    private final ChatClient chatClient;
    private final AsrClient asrClient;
    private final TtsClient ttsClient;

    @PostMapping
    public String createSession(@RequestParam String characterId) {
        return repo.createSession(characterId);
    }

    @PostMapping("/{sessionId}/messages")
    public SendMessageResponse sendText(@PathVariable String sessionId, @RequestBody SendTextRequest request) {
        String characterId = repo.getCharacterId(sessionId).orElseThrow(() -> new IllegalArgumentException("Session not found"));

        // 保存用户消息
        MessageItem userMessage = MemoryRepo.msg("user", request.getText(), null);
        repo.appendMessage(sessionId, userMessage);

        // 组装历史记录
        List<ChatClient.Message> history = toAiHistory(sessionId);
        ChatClient.ChatResponse response = chatClient.chat(new ChatClient.ChatRequest(characterId, history));

        // 保存 AI 回复消息
        MessageItem assistantMessage = MemoryRepo.msg("assistant", response.getText(), null);
        repo.appendMessage(sessionId, assistantMessage);

        // 可选：TTS 转语音
        TtsClient.TtsResult ttsResult = ttsClient.tts(new TtsClient.TtsRequest(response.getText(), "en-US-female-1"));
        assistantMessage.setAudioUrl(ttsResult.getAudioUrl());

        return new SendMessageResponse(userMessage, assistantMessage);
    }

    private List<ChatClient.Message> toAiHistory(String sessionId) {
        List<MessageItem> messages = repo.listMessages(sessionId, 100, null);
        List<ChatClient.Message> history = new ArrayList<>();
        for (MessageItem message : messages) {
            history.add(new ChatClient.Message(message.getRole(), message.getText()));
        }
        return history;
    }
}
