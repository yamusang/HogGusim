package com.matchpet.domain.manager.entity;

import com.matchpet.domain.match.Enums.Level3;
import jakarta.persistence.*;
import lombok.Getter; import lombok.Setter;

@Entity @Getter @Setter
@Table(name = "managers")
public class ManagerProfile {
  @Id
  @Column(name = "user_id")
  private Long userId;

  private String name;
  private String phoneNumber;
  private String address;
  private String affiliation;

  @Enumerated(EnumType.STRING)
  private Level3 elderlyExpLevel;   // LOW/MID/HIGH

  @Column(precision = 3, scale = 2)
  private Double reliabilityScore;  // 0.00 ~ 1.00

  @Column(columnDefinition = "json")
  private String animalSkillTags;   // ["high_energy_handling","device_friendly"]
}
