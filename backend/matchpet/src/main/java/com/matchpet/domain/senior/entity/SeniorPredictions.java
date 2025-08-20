package com.matchpet.domain.senior.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "senior_predictions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SeniorPredictions {
  @Id
  @Column(name = "user_id")
  private Long userId;

  public enum PredLevel3 { LOW, MID, HIGH, UNKNOWN }
  public enum PredVisitStyle { QUIET, ACTIVE, COMPANION, UNKNOWN }

  @Enumerated(EnumType.STRING)
  @Column(name = "pred_mobility")
  private PredLevel3 predMobility;

  @Column(name = "conf_mobility")
  private Integer confMobility; // 0~100

  @Enumerated(EnumType.STRING)
  @Column(name = "pred_visit_style")
  private PredVisitStyle predVisitStyle;

  @Column(name = "conf_visit_style")
  private Integer confVisitStyle;

  @Enumerated(EnumType.STRING)
  @Column(name = "pred_tech")
  private PredLevel3 predTech;

  @Column(name = "conf_tech")
  private Integer confTech;

  @Column(name = "updated_at", insertable = false, updatable = false)
  private LocalDateTime updatedAt;
}
