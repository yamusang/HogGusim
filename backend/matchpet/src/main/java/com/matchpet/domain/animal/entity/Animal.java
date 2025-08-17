package com.matchpet.domain.animal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "animals", indexes = {
        @Index(name = "idx_animals_desertion_no", columnList = "desertion_no", unique = true),
        @Index(name = "idx_animals_external_id", columnList = "external_id")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Animal {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 외부 시스템의 식별자(우리 시스템에서 참조용). DB에 NOT NULL 이므로 항상 채운다. */
    @Column(name = "external_id", length = 64, nullable = false)
    private String externalId;

    @Column(name = "desertion_no", length = 30, nullable = false, unique = true)
    private String desertionNo;

    @Column(name = "happen_dt")
    private LocalDate happenDt;

    @Column(name = "happen_place", length = 255)
    private String happenPlace;

    @Column(name = "kind_cd", length = 60)
    private String kindCd;

    @Column(name = "color_cd", length = 60)
    private String colorCd;

    @Column(name = "age", length = 40)
    private String age;

    @Column(name = "weight", length = 40)
    private String weight;

    @Column(name = "sex_cd", length = 3)
    private String sexCd;

    @Column(name = "neuter_yn", length = 1)
    private String neuterYn;

    @Column(name = "special_mark", length = 500)
    private String specialMark;

    @Column(name = "care_nm", length = 120)
    private String careNm;

    @Column(name = "care_tel", length = 60)
    private String careTel;

    @Column(name = "care_addr", length = 255)
    private String careAddr;

    @Column(name = "process_state", length = 60)
    private String processState;

    @Column(name = "filename", length = 300)
    private String filename;

    @Column(name = "popfile", length = 300)
    private String popfile;
}
