package com.matchpet.web.dto;

public record PairSuggestionDto(
  PetRecoDto pet,
  ManagerRecoDto manager,
  double totalScore
){}
