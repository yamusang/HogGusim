package com.matchpet.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder
@NoArgsConstructor @AllArgsConstructor
public class CardDto {
    private String desertionNo;
    private String happenDt;
    private String kind;
    private String color;
    private String sex;         // M/F/Q
    private String neuter;      // Y/N/U
    private String processState; 
    private String thumbnail;   // filename
    private String image;       // popfile
    private String careName;
    private String careTel;
    private String careAddr;
    private String specialMark;
}
