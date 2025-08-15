package com.matchpet.domain.animal.entity;

import com.matchpet.domain.animal.enums.AnimalStatus;
import com.matchpet.domain.animal.enums.NeuterStatus;
import com.matchpet.domain.animal.enums.Sex;
import com.matchpet.domain.shelter.entity.Shelter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "animals",
    uniqueConstraints = @UniqueConstraint(name = "uq_animals_external_id", columnNames = "external_id"))
@Getter @Setter
public class Animal {

  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  /** 외부 유기동물 ID (공공데이터 desertionNo) */
  @Column(name = "external_id", nullable = false, length = 32)
  private String externalId;

  // ── AnimalMapper / ExternalAnimalIngestService가 요구하는 필드들 ──
  private String thumbnailUrl;     // a.getThumbnailUrl()
  private String species;          // a.getSpecies()
  private String breed;            // a.getBreed()
  private String color;            // a.getColor()
  private Integer ageMonths;       // a.getAgeMonths()
  @Enumerated(EnumType.STRING)
  private Sex sex;                 // a.getSex()
  @Enumerated(EnumType.STRING)
  private NeuterStatus neuterStatus; // a.getNeuterStatus()
  @Enumerated(EnumType.STRING)
  private AnimalStatus status;     // a.getStatus()

  private LocalDate intakeDate;    // a.getIntakeDate()
  private String description;      // a.getDescription()

  // ── 공공데이터 원문 필드(있어도 무방) ──
  private LocalDate happenDt;
  private String happenPlace;
  private String kindCd;
  private String colorCd;
  private String ageText;
  private String weightText;
  private String sexCd;      // 원문 M/F/Q
  private String neuterYn;   // 원문 Y/N/U
  private String processState;
  private String orgNm;
  private String popfile;
  private String specialMark;
  private LocalDate noticeSdt;
  private LocalDate noticeEdt;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "shelter_id")
  private Shelter shelter;         // a.getShelter().getName() 사용
}
