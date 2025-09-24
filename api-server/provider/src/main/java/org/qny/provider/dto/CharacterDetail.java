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
public class CharacterDetail {
    private String id;
    private String name;
    private String bio;
    private List<String> examplePrompts;
    private List<String> tags;
}
