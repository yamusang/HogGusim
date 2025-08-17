package com.matchpet.external.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/** 공공데이터포털 유기동물 API(JSON) 응답 매핑 */
@Getter @Setter
public class ExternalResponse {
    private Response response;

    @Getter @Setter
    public static class Response {
        private Header header;
        private Body body;
    }

    @Getter @Setter
    public static class Header {
        private String resultCode;
        private String resultMsg;
    }

    @Getter @Setter
    public static class Body {
        private Items items;
        private Integer numOfRows;
        private Integer pageNo;
        private Integer totalCount;
    }

    @Getter @Setter
    public static class Items {
        private List<Item> item;
    }

    /** 실제 한 마리 레코드 */
    @Getter @Setter
    public static class Item {
        private String desertionNo;
        private String happenDt;
        private String happenPlace;
        private String kindCd;
        private String colorCd;
        private String age;
        private String weight;
        private String sexCd;        // M/F/Q
        private String neuterYn;     // Y/N/U
        private String specialMark;
        private String careNm;
        private String careTel;
        private String careAddr;
        private String processState;
        private String filename;
        private String popfile;
        // 선택 필드들
        private String noticeNo;
        private String noticeSdt;
        private String noticeEdt;
        private String orgNm;
        private String chargeNm;
        private String officetel;
    }
}
