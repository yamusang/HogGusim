// src/main/java/com/matchpet/web/dto/RecoPetDto.java
package com.matchpet.web.dto;

import com.matchpet.domain.animal.entity.Animal;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class RecoPetDto {
    private Long id;
    private String desertionNo;
    private String name;        // 없으면 null
    private String breed;       // "[개] 시바견" -> "시바견"으로 정리
    private String age;         // 문자열
    private String photoUrl;    // popfile 우선
    private String thumbnail;   // filename 우선
    private String sex;         // '수컷/암컷/미상'
    private String neuter;      // '예/아니오/미상'
    private Double matchScore;
    private String reason;

    /** Animal -> RecoPetDto */
    public static RecoPetDto from(Animal a, Double score, String reason) {
        String photo = notBlank(a.getPopfile()) ? a.getPopfile()
                      : notBlank(a.getFilename()) ? a.getFilename() : null;
        String thumb = notBlank(a.getFilename()) ? a.getFilename()
                      : notBlank(a.getPopfile()) ? a.getPopfile() : null;

        return RecoPetDto.builder()
            .id(a.getId())
            .desertionNo(a.getDesertionNo())
            .name(null) // Animal에 name 없으면 null 유지
            .breed(sanitizeBreed(a.getKindCd()))
            .age(a.getAge())
            .photoUrl(photo)
            .thumbnail(thumb)
            .sex(toSexLabel(a.getSexCd()))
            .neuter(toNeuterLabel(a.getNeuterYn()))
            .matchScore(score)
            .reason(reason)
            .build();
    }

    private static boolean notBlank(String s){ return s != null && !s.isBlank(); }
    private static String sanitizeBreed(String kindCd){
        if (!notBlank(kindCd)) return null;
        String v = kindCd.trim();
        if (v.matches("^\\d+$")) return null;
        return v.replaceFirst("^\\[[^\\]]+\\]\\s*", "");
    }
    private static String toSexLabel(String code){
        if (!notBlank(code)) return "-";
        return switch (code.trim().toUpperCase()) {
            case "M" -> "수컷";
            case "F" -> "암컷";
            case "Q" -> "미상";
            default -> code;
        };
    }
    private static String toNeuterLabel(String code){
        if (!notBlank(code)) return "-";
        return switch (code.trim().toUpperCase()) {
            case "Y" -> "예";
            case "N" -> "아니오";
            case "U" -> "미상";
            default -> code;
        };
    }
}
