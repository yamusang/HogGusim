package com.matchpet.web.dto;

import com.matchpet.domain.application.enums.ApplicationStatus;
import lombok.*; import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ApplicationListItem {
  private Long id; private ApplicationStatus status; private LocalDateTime createdAt;
  private Long seniorUserId; private String seniorName; private String seniorPhone;
  private Long animalId; private String desertionNo; private String kind; private String careNm;
}
