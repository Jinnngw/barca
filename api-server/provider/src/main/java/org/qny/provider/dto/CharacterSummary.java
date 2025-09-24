package org.qny.provider.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CharacterSummary {
    private String id;
    private String name;
    private String description;
    private List<String> tags;
}
