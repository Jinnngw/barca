package org.qny.provider.core;

import org.qny.provider.dto.MessageItem;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.*;
@Component
public class MemoryRepo {
    private final Map<String, String> sessionToCharacter = new HashMap<>();
    private final Map<String, List<MessageItem>> sessionMessages = new HashMap<>();

    public String createSession(String characterId) {
        String sessionId = UUID.randomUUID().toString();
        sessionToCharacter.put(sessionId, characterId);
        sessionMessages.put(sessionId, new ArrayList<>());
        return sessionId;
    }

    public Optional<String> getCharacterId(String sessionId) {
        return Optional.ofNullable(sessionToCharacter.get(sessionId));
    }

    public void appendMessage(String sessionId, MessageItem message) {
        sessionMessages.computeIfAbsent(sessionId, k -> new ArrayList<>()).add(message);
    }

    public List<MessageItem> listMessages(String sessionId, int limit, String cursor) {
        List<MessageItem> messages = sessionMessages.getOrDefault(sessionId, new ArrayList<>());
        int start = cursor != null ? Integer.parseInt(cursor) : 0;
        int end = Math.min(start + limit, messages.size());
        return messages.subList(start, end);
    }

    public static MessageItem msg(String role, String text, String audioUrl) {
        return new MessageItem(UUID.randomUUID().toString(), role, text, audioUrl, Instant.now());
    }
}
