package com.matchpet.domain.animal.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "animals")
@Getter @Setter
public class Animal {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  // ====== 기존 컬럼들 ======
  @Column(name = "desertion_no") private String desertionNo;
  @Column(name = "happen_dt")    private LocalDate happenDt;
  @Column(name = "kind_cd")      private String kindCd;
  @Column(name = "color_cd")     private String colorCd;
  @Column(name = "sex_cd")       private String sexCd;
  @Column(name = "neuter_yn")    private String neuterYn;
  @Column(name = "process_state") private String processState;
  @Column(name = "filename")     private String filename;
  @Column(name = "popfile")      private String popfile;

  @Column(name = "care_nm")   private String careNm;   // ★ 필수
  @Column(name = "care_tel")  private String careTel;
  @Column(name = "care_addr") private String careAddr;

  @Column(name = "special_mark") private String specialMark;
  @Column(name = "notice_sdt")   private String noticeSdt;
  @Column(name = "notice_edt")   private String noticeEdt;
  @Column(name = "org_nm")       private String orgNm;

  // ====== [추가] 매칭용 최소 필드 5개 ======
  @Column(name = "shelter_id") private Long shelterId; // FK지만 간단히 Long 매핑

  @Enumerated(EnumType.STRING)
  @Column(name = "energy_level")
  private com.matchpet.domain.match.Enums.Level3 energyLevel; // LOW/MID/HIGH

  @Enumerated(EnumType.STRING)
  @Column(name = "temperament")
  private com.matchpet.domain.match.Enums.VisitStyle temperament; // QUIET/ACTIVE/COMPANION

  @Column(name = "device_required", nullable = false)
  private boolean deviceRequired;

  // DB의 ENUM 값과 정합성 이슈를 피하려고 String으로 매핑(AVAILABLE/MATCHING/…)
  @Column(name = "status", nullable = false)
  private String status;

  // 타임스탬프(기존)
  @Column(name = "created_at", insertable = false, updatable = false)
  private LocalDateTime createdAt;
  @Column(name = "updated_at", insertable = false, updatable = false)
  private LocalDateTime updatedAt;
}
