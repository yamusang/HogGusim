package com.matchpet.domain.animal.dto;

import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.web.dto.CardDto;
import com.matchpet.web.dto.RecoPetDto;

import java.time.format.DateTimeFormatter;

public final class AnimalMapper {
    private static final DateTimeFormatter D = DateTimeFormatter.ISO_LOCAL_DATE;

    private AnimalMapper() {}

    public static CardDto toCard(Animal a) {
        return CardDto.builder()
            .id(a.getId())
            .desertionNo(a.getDesertionNo())
            .happenDt(a.getHappenDt() != null ? a.getHappenDt().format(D) : null)
            .kind(a.getBreed())
            .color(a.getColor())
            .sex(sexLabel(a.getSex()))
            .neuter(a.getNeuter() == null ? "U" : a.getNeuter())
            .processState(a.getProcessState())
            .thumbnail(a.getFilename())
            .image(a.getPopfile())
            .careName(a.getCareNm())
            .careTel(a.getCareTel())
            .careAddr(a.getCareAddr())
            .specialMark(a.getSpecialMark())
            .build();
    }

    public static RecoPetDto toReco(Animal a, double score, String reason) {
        return RecoPetDto.builder()
            .id(a.getId())
            .desertionNo(a.getDesertionNo())
            .name(null)
            .breed(a.getBreed())
            .age(a.getAge())
            .photoUrl(a.getPopfile())
            .thumbnail(a.getFilename())
            .sex(sexLabel(a.getSex()))
            .neuter(neuterLabel(a.getNeuter()))
            .matchScore(score)
            .reason(reason)
            .build();
    }

    private static String sexLabel(String code) {
        if ("M".equalsIgnoreCase(code)) return "수컷";
        if ("F".equalsIgnoreCase(code)) return "암컷";
        return "-";
    }
    private static String neuterLabel(String code) {
        if ("Y".equalsIgnoreCase(code)) return "예";
        if ("N".equalsIgnoreCase(code)) return "아니오";
        return "-";
    }
}
