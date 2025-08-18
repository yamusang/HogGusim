package com.matchpet.domain.animal.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "animals", indexes = {
        @Index(name = "idx_animals_external_id", columnList = "external_id"),
        @Index(name = "idx_animals_desertion_no", columnList = "desertion_no")
})
@NoArgsConstructor(access = AccessLevel.PUBLIC)   // ★ JPA 필수
@AllArgsConstructor      
@Builder(toBuilder = true)
public class Animal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "external_id", nullable = false, unique = true, length = 64)
    private String externalId; // 업서트 기준

    @Column(name = "desertion_no", nullable = true, unique = true, length = 32)
    private String desertionNo; // 보조 키(없을 수 있음)

    @Column(name = "happen_dt")
    private LocalDate happenDt;
    @Column(name = "happen_place", length = 255)
    private String happenPlace;
    @Column(name = "kind_cd", length = 80)
    private String kindCd;
    @Column(name = "color_cd", length = 80)
    private String colorCd;
    @Column(name = "age", length = 40)
    private String age;
    @Column(name = "weight", length = 40)
    private String weight;
    @Column(name = "sex_cd", length = 1)
    private String sexCd;
    @Column(name = "neuter_yn", length = 1)
    private String neuterYn;
    @Column(name = "special_mark", columnDefinition = "TEXT")
    private String specialMark;
    @Column(name = "care_nm", length = 120)
    private String careNm;
    @Column(name = "care_tel", length = 40)
    private String careTel;
    @Column(name = "care_addr", length = 255)
    private String careAddr;
    @Column(name = "process_state", length = 60)
    private String processState;
    @Column(name = "filename", length = 300)
    private String filename;
    @Column(name = "popfile", length = 300)
    private String popfile;
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
    @Column(name = "officetel")
    private String officetel;

    @Column(name = "created_at", updatable = false, insertable = false, columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP")
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
    private java.time.LocalDateTime updatedAt;
}
