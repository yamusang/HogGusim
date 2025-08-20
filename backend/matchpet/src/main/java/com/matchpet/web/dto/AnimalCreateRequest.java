package com.matchpet.web.dto;
import lombok.Getter; import lombok.Setter;

@Getter @Setter
public class AnimalCreateRequest {
  private String careNm;     // 보호소명
  private String careAddr;   // 주소
  private String careTel;    // 전화
  private String kindCd;     // 품종/종류 (예: "[개] 믹스견")
  private String sexCd;      // "M"|"F"|"Q"
  private String neuterYn;   // "Y"|"N"|"U"
  private String age;        // 문자열 원문
  private String specialMark;
  private String processState; // 기본: "보호중"
  private String status;       // 내부상태(옵션): "AVAILABLE"
}
