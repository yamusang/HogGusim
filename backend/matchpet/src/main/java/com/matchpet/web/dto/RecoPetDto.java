// src/main/java/com/matchpet/web/dto/RecoPetDto.java
package com.matchpet.web.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class RecoPetDto {
    private Long id;
    private String desertionNo;
    private String name;        // 있으면 전달, 없으면 null
    private String breed;       // or species
    private String age;         // 문자열로 통일
    private String photoUrl;    // popfile 등
    private Double matchScore;  // 추천 점수(가짜라도 채워줌)
}
