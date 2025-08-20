// src/main/java/com/matchpet/domain/animal/entity/Animal.java
package com.matchpet.domain.animal.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "animals")
public class Animal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "external_id", nullable = false, unique = true, length = 64)
    private String externalId;

    @Column(name = "desertion_no")
    private String desertionNo;

    @Column(name = "happen_dt")
    private LocalDate happenDt;

    @Column(name = "happen_place")
    private String happenPlace;

    @Column(name = "kind_cd")
    private String kindCd;

    @Column(name = "color_cd")
    private String colorCd;

    private String age;
    private String weight;

    @Column(name = "sex_cd")
    private String sexCd;

    @Column(name = "neuter_yn")
    private String neuterYn;

    @Column(name = "special_mark")
    private String specialMark;

    @Column(name = "care_nm")
    private String careNm;

    @Column(name = "care_tel")
    private String careTel;

    @Column(name = "care_addr")
    private String careAddr;

    @Column(name = "process_state")
    private String processState;

    private String filename; // thumbnail
    private String popfile; // photo url

    // 공고/행정 필드 (서비스 apply()/upsertOne() 에서 사용)
    @Column(name = "notice_no")
    private String noticeNo;

    @Column(name = "notice_sdt")
    private LocalDate noticeSdt;

    @Column(name = "notice_edt")
    private LocalDate noticeEdt;

    @Column(name = "upr_cd")
    private String uprCd;

    @Column(name = "org_nm")
    private String orgNm;

    @Column(name = "charge_nm")
    private String chargeNm;

    private String officetel;

    // 서비스 확장 필드들(이미 DB ALTER 했던 것들)
    @Enumerated(EnumType.STRING)
    private Status status = Status.AVAILABLE;

    public enum Status {
        AVAILABLE, MATCHING, CONNECTED, RETURNED
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "energy_level")
    private EnergyLevel energyLevel;

    public enum EnergyLevel {
        LOW, MID, HIGH
    }

    @Enumerated(EnumType.STRING)
    private Temperament temperament;

    public enum Temperament {
        QUIET, ACTIVE, COMPANION
    }

    @Column(name = "device_required")
    private boolean deviceRequired;

    @Column(name = "shelter_id")
    private Long shelterId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Transient
    public String getBreed() {
        return getKindCd();
    }

    @Transient
    public String getColor() {
        return getColorCd();
    }

    @Transient
    public String getSex() {
        return getSexCd();
    }

    @Transient
    public String getNeuter() {
        return getNeuterYn();
    }
}
