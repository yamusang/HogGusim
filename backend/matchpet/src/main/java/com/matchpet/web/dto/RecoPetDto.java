package com.matchpet.web.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RecoPetDto {
  // 점수 & 사유
  private double score;      // 프론트의 matchScore 대체 가능(프론트가 score도 읽음)
  private String reason;

  // 코어 id
  private Long id;           // 내부 animal PK
  private String desertionNo;

  // 프로필 핵심
  private String name;       // 있으면 세팅, 없으면 null
  private String breed;      // 프론트 mapRecoPet는 breed 또는 kind를 봄
  private String kind;       // = kindCd 별칭
  private String kindCd;     // 원본

  // 나이/성별/중성화
  private String age;
  private String sex;        // (프론트가 normalizeSex 적용)
  private String sexCd;      // 원본
  private String neuter;     // (프론트가 normalizeNeuter 적용)
  private String neuterYn;   // 원본

  // 보호 상태
  private String processState;

  // 보호소/주소
  private String careNm;
  private String careName;   // alias
  private String careAddr;

  // 이미지
  private String photoUrl;   // 프론트 mapRecoPet가 우선 읽는 키
  private String popfile;    // 공공데이터 원본(동일 값 복제)
  private String thumbnail;  // 필요 시 썸네일 (없으면 null)

  // 기타
  private String weight;
  private String temperament;
  private String specialMark;
}
