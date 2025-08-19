package com.matchpet.web.dto;

import com.matchpet.domain.manager.entity.ManagerProfile;

public record ManagerRecoDto(
  Long id,
  String name,
  double matchScoreManager,
  Double reliability,
  String elderlyExpLevel
){
  public static ManagerRecoDto from(ManagerProfile m, double score){
    return new ManagerRecoDto(
      m.getUserId(),
      m.getName(),
      score,
      m.getReliabilityScore()==null?0.0:m.getReliabilityScore(),
      m.getElderlyExpLevel()==null?null:m.getElderlyExpLevel().name()
    );
  }
}
