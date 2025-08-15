// src/main/java/com/matchpet/external/dto/ExternalResponse.java
package com.matchpet.external.dto;

import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ExternalResponse(Response response) {

  @JsonIgnoreProperties(ignoreUnknown = true)
  public record Response(Body body) {}

  @JsonIgnoreProperties(ignoreUnknown = true)
  public record Body(Items items) {}

  @JsonIgnoreProperties(ignoreUnknown = true)
  public record Items(@JsonProperty("item") List<ExternalAnimal> itemList) {}

  @JsonIgnoreProperties(ignoreUnknown = true)
  public record ExternalAnimal(
      // 기본 식별/보호소
      @JsonProperty("desertionNo") @JsonAlias("desertion_no") String id,
      @JsonProperty("careRegNo")   @JsonAlias("care_reg_no")  String shelterId,
      @JsonProperty("careNm")      String shelterName,
      @JsonProperty("careTel")     String shelterTel,
      @JsonProperty("careAddr")    String shelterAddr,
      @JsonProperty("uprCd")       String region,

      // 위치
      @JsonProperty("latitude")    Double lat,
      @JsonProperty("longitude")   Double lng,

      // 분류/상태
      @JsonProperty("kindCd")      String species,     // "[개] 믹스견" 형태
      @JsonProperty("colorCd")     String color,
      @JsonProperty("sexCd")       @JsonAlias("sex_cd") String sex,         // M/F/Q
      @JsonProperty("neuterYn")    @JsonAlias("neuter_yn") String neuter,   // ✅ 서비스가 neuter()를 기대
      @JsonProperty("processState") String status,                           // ✅ 서비스가 status()를 기대

      // 날짜
      @JsonProperty("happenDt") @JsonDeserialize(using = YmdLocalDateDeserializer.class) LocalDate intakeDate,  // ✅ 서비스가 intakeDate() 기대
      @JsonProperty("noticeSdt") @JsonDeserialize(using = YmdLocalDateDeserializer.class) LocalDate noticeStart,
      @JsonProperty("noticeEdt") @JsonDeserialize(using = YmdLocalDateDeserializer.class) LocalDate noticeEnd,

      // 이미지/설명
      @JsonProperty("filename") String thumb,
      @JsonProperty("popfile")  @JsonAlias({ "popfile1", "popfile2" }) String image,
      @JsonProperty("specialMark") String desc,                              // ✅ 서비스가 desc()를 기대

      // 그 외 텍스트
      @JsonProperty("age")     String ageText,
      @JsonProperty("weight")  String weightText
  ) {}

  public List<ExternalAnimal> items() {
    return response != null &&
           response.body() != null &&
           response.body().items() != null &&
           response.body().items().itemList() != null
        ? response.body().items().itemList()
        : List.of();
  }
}
