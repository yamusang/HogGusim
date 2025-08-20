package com.matchpet.web.dto;

import com.matchpet.domain.application.entity.Application;
import com.matchpet.domain.application.enums.ApplicationStatus;
import lombok.*; import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ApplicationResponse {
  private Long id; private Long seniorUserId; private Long animalId;
  private ApplicationStatus status; private String name; private String gender;
  private Integer age; private String timeRange; private String days; private String date;
  private String phone; private String emergency; private Integer visitsPerWeek;
  private LocalDateTime createdAt;

  public static ApplicationResponse from(Application a){
    return ApplicationResponse.builder()
      .id(a.getId()).seniorUserId(a.getSeniorUserId()).animalId(a.getAnimalId())
      .status(a.getStatus()).name(a.getName()).gender(a.getGender())
      .age(a.getApplicantAge()).timeRange(a.getTimeRange()).days(a.getDays())
      .date(a.getDateText()).phone(a.getPhone()).emergency(a.getEmergency())
      .visitsPerWeek(a.getVisitsPerWeek()).createdAt(a.getCreatedAt()).build();
  }
}
