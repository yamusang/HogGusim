package com.matchpet.domain.animal.dto;

import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.animal.support.Labels;

public final class AnimalMapper {
  private AnimalMapper() {}
  public static AnimalCardDto toCard(Animal a){
    return new AnimalCardDto(
        a.getId(),
        a.getThumbnailUrl(),
        a.getSpecies(),
        a.getBreed(),
        Labels.sex(a.getSex()),
        Labels.neuter(a.getNeuterStatus()),
        Labels.ageText(a.getAgeMonths()),
        a.getColor(),
        a.getStatus().name(),
        a.getShelter() != null ? a.getShelter().getName() : null
    );
  }
}
