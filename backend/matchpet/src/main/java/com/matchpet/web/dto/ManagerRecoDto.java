// src/main/java/com/matchpet/web/dto/ManagerRecoDto.java
package com.matchpet.web.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ManagerRecoDto {
  private Long id;
  private String name;
  private String intro;
  private String photoUrl;
  private Double matchScore;
}
