package com.matchpet.domain.animal.dto;

public record AnimalCardDto(
    Long id,
    String thumbnailUrl,
    String species,
    String breed,
    String sexLabel,
    String neuterLabel,
    String ageText,
    String color,
    String status,
    String shelterName
) {}
