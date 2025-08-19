// src/main/java/com/matchpet/domain/animal/dto/AnimalMapper.java
package com.matchpet.domain.animal.dto;

import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.web.dto.CardDto;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public final class AnimalMapper {
  private static final DateTimeFormatter DF = DateTimeFormatter.ISO_DATE;

  private AnimalMapper() {}

  public static CardDto toCard(Animal a) {
    if (a == null) return CardDto.builder().build();

    // LocalDate -> String
    String happenDtStr = null;
    LocalDate dt = a.getHappenDt();
    if (dt != null) happenDtStr = dt.format(DF);

    // 코드값 -> 표시값
    String sex = toSexLabel(a.getSexCd());        // M/F/Q -> 수컷/암컷/미상
    String neuter = toNeuterLabel(a.getNeuterYn()); // Y/N/U -> 예/아니오/미상

    // 이미지/썸네일: popfile 우선, 없으면 filename
    String image = coalesce(a.getPopfile(), a.getFilename());
    String thumb = coalesce(a.getFilename(), a.getPopfile());

    return CardDto.builder()
        .desertionNo(nz(a.getDesertionNo()))
        .happenDt(nz(happenDtStr))
        .kind(nz(a.getKindCd()))          // 필요하면 코드→품종명 변환 로직 추가
        .color(nz(a.getColorCd()))
        .sex(nz(sex))
        .neuter(nz(neuter))
        .processState(nz(a.getProcessState()))
        .thumbnail(nz(thumb))
        .image(nz(image))
        .careName(nz(a.getCareNm()))
        .careTel(nz(a.getCareTel()))
        .careAddr(nz(a.getCareAddr()))
        .specialMark(nz(a.getSpecialMark()))
        .build();
  }

  private static String nz(String v) {
    return (v == null || v.isBlank()) ? "-" : v;
  }

  private static String coalesce(String a, String b) {
    return (a != null && !a.isBlank()) ? a : b;
  }

  private static String toSexLabel(String code) {
    if (code == null) return "-";
    return switch (code.trim().toUpperCase()) {
      case "M" -> "수컷";
      case "F" -> "암컷";
      case "Q" -> "미상";
      default -> code;
    };
  }

  private static String toNeuterLabel(String code) {
    if (code == null) return "-";
    return switch (code.trim().toUpperCase()) {
      case "Y" -> "예";
      case "N" -> "아니오";
      case "U" -> "미상";
      default -> code;
    };
  }
}
