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
    private String audioUrl; // optional
    private Instant time;
}
