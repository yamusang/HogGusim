package com.matchpet.web.dto;

import lombok.Builder;
import lombok.Getter;

@Getter @Builder
public class CardDto {
    private Long id;
    private String desertionNo;
    private String happenDt;
    private String kind;
    private String color;
    private String sex;        // "수컷"/"암컷"/"-"
    private String neuter;     // "Y"/"N"/"U"  (대시보드용 그대로)
    private String processState;
    private String thumbnail;  // filename
    private String image;      // popfile
    private String careName;
    private String careTel;
    private String careAddr;
    private String specialMark;
}
