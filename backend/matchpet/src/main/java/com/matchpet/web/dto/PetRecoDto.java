package com.matchpet.web.dto;

import com.matchpet.domain.animal.entity.Animal;

public record PetRecoDto(
  Long id,
  String desertionNo,
  String photoUrl,
  double matchScore
){
  public static PetRecoDto from(Animal a, double score){
    String photo = a.getPopfile()!=null ? a.getPopfile() : a.getFilename();
    return new PetRecoDto(a.getId(), a.getDesertionNo(), photo, score);
  }
}
