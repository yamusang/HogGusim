package com.matchpet.external.dto;

import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ExternalResponse(Response response) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Response(Body body) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Body(Items items) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Items(@JsonProperty("item") List<ExternalAnimal> itemList) {
    }

    public List<ExternalAnimal> items() {
        return response != null &&
                response.body() != null &&
                response.body().items() != null &&
                response.body().items().itemList() != null
                        ? response.body().items().itemList()
                        : List.of();
    }

    // public Integer totalCount() { return response != null && response.body() != null ? response.body().totalCount() : null; }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ExternalAnimal(
            @JsonProperty("desertionNo") @JsonAlias("desertion_no") String id,
            @JsonProperty("careRegNo") @JsonAlias("care_reg_no") String shelterId,
            @JsonProperty("careNm") String shelterName,
            @JsonProperty("careTel") String shelterTel,
            @JsonProperty("careAddr") String shelterAddr,
            @JsonProperty("uprCd") String region,

            // 위/경도는 응답에 없을 수 있음 → 있으면 매핑, 없으면 null
            @JsonProperty("latitude") Double lat,
            @JsonProperty("longitude") Double lng,

            // 품종/종 정보(예: "[고양이] 한국 고양이")
            @JsonProperty("kindFullNm") @JsonAlias( {
                    "kindNm", "kindCd" }) String species,

            @JsonProperty("sexCd") @JsonAlias("sex_cd") String sex,
            @JsonProperty("neuterYn") @JsonAlias("neuter_yn") String neuter,

            // 실제 필드명
            @JsonProperty("processState") String status,

            @JsonProperty("colorCd") String color,

            // yyyyMMdd 포맷
            @JsonProperty("happenDt") @JsonDeserialize(using = YmdLocalDateDeserializer.class) @JsonFormat(pattern = "yyyyMMdd") LocalDate intakeDate,

            @JsonProperty("noticeSdt") @JsonDeserialize(using = YmdLocalDateDeserializer.class) @JsonFormat(pattern = "yyyyMMdd") LocalDate noticeStart,

            @JsonProperty("noticeEdt") @JsonDeserialize(using = YmdLocalDateDeserializer.class) @JsonFormat(pattern = "yyyyMMdd") LocalDate noticeEnd,

            @JsonProperty("filename") String thumb, // 썸네일
            @JsonProperty("popfile") @JsonAlias({ "popfile1", "popfile2" }) String image, // 원본 이미지(1개만 사용)
            @JsonProperty("specialMark") String desc,

            @JsonProperty("age") String ageText, // 예: "2023(년생)"
            @JsonProperty("weight") String weightText // 예: "5(Kg)"
        ){
    }
}
