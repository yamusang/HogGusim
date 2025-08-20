package com.matchpet.domain.application.entity;

import com.matchpet.domain.application.enums.ApplicationStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name="applications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Application {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name="senior_user_id", nullable=false) private Long seniorUserId;
  @Column(name="animal_id", nullable=false)      private Long animalId;

  @Enumerated(EnumType.STRING) @Column(nullable=false)
  private ApplicationStatus status = ApplicationStatus.PENDING;

  private String name; private String gender;
  @Column(name="applicant_age") private Integer applicantAge;
  private String experience; private String address;
  @Column(name="time_range") private String timeRange;
  private String days; @Column(name="date_text") private String dateText;
  private String phone; private String emergency;
  @Column(name="agree_terms",   nullable=false) private boolean agreeTerms;
  @Column(name="agree_bodycam", nullable=false) private boolean agreeBodycam;
  @Column(name="visits_per_week") private Integer visitsPerWeek;

  @Column(name="created_at", insertable=false, updatable=false) private LocalDateTime createdAt;
  @Column(name="updated_at", insertable=false, updatable=false) private LocalDateTime updatedAt;
}
