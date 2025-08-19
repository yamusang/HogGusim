// src/main/java/com/matchpet/web/dto/RecoManagerDto.java
package com.matchpet.web.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class RecoManagerDto {
    private Long id;
    private String name;
    private String intro;
    private Double matchScore;
    private String photoUrl;
}
