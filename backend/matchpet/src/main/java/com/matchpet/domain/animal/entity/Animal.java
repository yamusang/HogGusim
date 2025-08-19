package com.matchpet.domain.animal.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "animals")
@Getter @Setter
public class Animal {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "desertion_no") private String desertionNo;
  @Column(name = "happen_dt")    private LocalDate happenDt;
  @Column(name = "kind_cd")      private String kindCd;
  @Column(name = "color_cd")     private String colorCd;
  @Column(name = "sex_cd")       private String sexCd;
  @Column(name = "neuter_yn")    private String neuterYn;

  @Column(name = "process_state") private String processState;
  @Column(name = "filename")      private String filename;
  @Column(name = "popfile")       private String popfile;

  @Column(name = "care_nm")   private String careNm;   // ★ 필수
  @Column(name = "care_tel")  private String careTel;
  @Column(name = "care_addr") private String careAddr;

  @Column(name = "special_mark") private String specialMark;
  @Column(name = "notice_sdt")   private String noticeSdt;
  @Column(name = "notice_edt")   private String noticeEdt;
  @Column(name = "org_nm")       private String orgNm;

  @Column(name = "created_at", insertable = false, updatable = false)
  private LocalDateTime createdAt;
}
