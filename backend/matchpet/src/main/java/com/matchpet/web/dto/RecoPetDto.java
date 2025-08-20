package com.matchpet.web.dto;

import lombok.*;

@Getter @Setter
@AllArgsConstructor @NoArgsConstructor @Builder
public class RecoPetDto {
    private Long id;
    private String desertionNo;
    private String name;        // 대부분 null
    private String breed;
    private String age;
    private String photoUrl;
    private String thumbnail;
    private String sex;         // "수컷"/"암컷"/"-"
    private String neuter;      // "예"/"아니오"/"-"
    private double matchScore;  // 서버 계산
    private String reason;      // 설명
}
