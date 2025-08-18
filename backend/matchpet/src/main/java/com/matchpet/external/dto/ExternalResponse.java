package com.matchpet.external.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

/** 공공데이터포털 유기동물 API(JSON) 응답 매핑 */
@Getter @Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class ExternalResponse {
    private Response response;

    @Getter @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Response {
        private Header header;
        private Body body;
    }

    @Getter @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Header {
        private String resultCode;
        private String resultMsg;
    }

    @Getter @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Body {
        private Items items;
        private Integer numOfRows;
        private Integer pageNo;
        private Integer totalCount;
    }

    @Getter @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Items {
        private List<Item> item;
    }

    /** 실제 레코드 */
    @Getter @Setter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Item {
        private String desertionNo;

        @JsonDeserialize(using = YmdLocalDateDeserializer.class)
        private LocalDate happenDt;

        private String happenPlace;
        private String kindCd;
        private String colorCd;
        private String age;
        private String weight;
        private String sexCd;
        private String neuterYn;
        private String specialMark;
        private String careNm;
        private String careTel;
        private String careAddr;
        private String processState;
        private String filename;
        private String popfile;

        private String noticeNo;

        @JsonDeserialize(using = YmdLocalDateDeserializer.class)
        private LocalDate noticeSdt;

        @JsonDeserialize(using = YmdLocalDateDeserializer.class)
        private LocalDate noticeEdt;

        private String orgNm;
        private String chargeNm;
        private String officetel;

        /** 상위기관 코드(시/도 코드) */
        @JsonProperty("upr_cd")
        private String uprCd;

        /** 필요시 기타 코드들 */
        private String orgCd;
        private String careRegNo;
    }
}