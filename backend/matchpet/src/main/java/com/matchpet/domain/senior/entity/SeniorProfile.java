package com.matchpet.domain.senior.entity;

import com.matchpet.domain.match.Enums.Level3;
import com.matchpet.domain.match.Enums.VisitStyle;
import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;

@Entity @Getter @Setter
@Table(name = "seniors")
public class SeniorProfile {
  @Id
  @Column(name = "user_id")
  private Long userId;

  private String name;
  private String phoneNumber;
  private String address;

  // 매칭에 쓰는 최소 3개
  @Enumerated(EnumType.STRING)
  private Level3 mobilityLevel;            // LOW/MID/HIGH

  @Enumerated(EnumType.STRING)
  private VisitStyle preferredVisitStyle;  // QUIET/ACTIVE/COMPANION

  @Enumerated(EnumType.STRING)
  private Level3 techComfort;              // LOW/MID/HIGH
}
