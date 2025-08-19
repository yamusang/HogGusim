package com.matchpet.domain.animal.entity;

import com.matchpet.domain.match.Enums.Level3;
import com.matchpet.domain.match.Enums.VisitStyle;
import com.matchpet.domain.shelter.entity.Shelter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "animals")
@Getter @Setter
@ToString(exclude = "shelter")
public class Animal {

  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  /* === 외부/고유 식별자 === */
  @Column(name = "external_id", nullable = false, unique = true, length = 64)
  private String externalId;            // Ingest가 주키로 사용

  /* === 기존/원본 필드 === */
  @Column(name = "desertion_no") private String desertionNo;

  @Column(name = "happen_dt")    private LocalDate happenDt;
  @Column(name = "happen_place") private String happenPlace;

  @Column(name = "kind_cd")      private String kindCd;
  @Column(name = "color_cd")     private String colorCd;

  @Column(name = "age")          private String age;
  @Column(name = "weight")       private String weight;

  @Column(name = "sex_cd")       private String sexCd;
  @Column(name = "neuter_yn")    private String neuterYn;

  @Column(name = "special_mark") private String specialMark;

  @Column(name = "care_nm")      private String careNm;
  @Column(name = "care_tel")     private String careTel;
  @Column(name = "care_addr")    private String careAddr;

  @Column(name = "process_state") private String processState;
  @Column(name = "filename")      private String filename;
  @Column(name = "popfile")       private String popfile;

  @Column(name = "notice_no")    private String noticeNo;   // ★ ingest에서 세팅
  @Column(name = "notice_sdt")   private LocalDate  noticeSdt;
  @Column(name = "notice_edt")   private LocalDate  noticeEdt;

  @Column(name = "upr_cd")       private String uprCd;      // ★ ingest에서 세팅
  @Column(name = "org_nm")       private String orgNm;
  @Column(name = "charge_nm")    private String chargeNm;   // ★ ingest에서 세팅
  @Column(name = "officetel")    private String officetel;  // ★ ingest에서 세팅


  /* === 보호소 연관관계 === */
  @ManyToOne(fetch = FetchType.LAZY, optional = true)
  @JoinColumn(name = "shelter_id")   // FK: shelters.shelter_id
  private Shelter shelter;

  /* === 매칭용 필드 === */
  @Enumerated(EnumType.STRING)
  @Column(name = "energy_level")
  private Level3 energyLevel;              // LOW/MID/HIGH

  @Enumerated(EnumType.STRING)
  @Column(name = "temperament")
  private VisitStyle temperament;          // QUIET/ACTIVE/COMPANION

  @Column(name = "device_required", nullable = false)
  private boolean deviceRequired;

  /* DB는 ENUM일 수 있지만, 자바는 문자열로 안전하게 보관 */
  @Column(name = "status", nullable = false)
  private String status = "AVAILABLE";

  /* === 타임스탬프 === */
  @Column(name = "created_at", insertable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", insertable = false, updatable = false)
  private LocalDateTime updatedAt;
}
