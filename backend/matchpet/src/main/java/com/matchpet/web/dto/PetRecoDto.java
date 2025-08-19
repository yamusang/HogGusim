// src/main/java/com/matchpet/web/dto/PetRecoDto.java
package com.matchpet.web.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class PetRecoDto {
  private Long id;
  private String desertionNo;
  private String name;       // null이면 프론트가 #id로 폴백
  private String breed;      // 없으면 null
  private String age;        // 문자열로 통일
  private String photoUrl;   // popfile/filename 등
  private Double matchScore; // 0.0 ~ 1.0
}
