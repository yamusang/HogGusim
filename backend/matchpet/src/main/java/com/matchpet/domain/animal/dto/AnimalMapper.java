package com.matchpet.domain.animal.dto;

import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.web.dto.CardDto;

public class AnimalMapper {
  public static CardDto toCard(Animal a) {
    return new CardDto(
      a.getDesertionNo(),
      a.getHappenDt(),
      a.getKindCd(),
      a.getColorCd(),
      a.getSexCd(),
      a.getNeuterYn(),
      a.getProcessState(),
      a.getFilename(),
      a.getPopfile(),
      a.getCareNm(),
      a.getCareTel(),
      a.getCareAddr(),
      a.getSpecialMark(),
      a.getNoticeSdt(),
      a.getNoticeEdt(),
      a.getOrgNm(),
      a.getCreatedAt()
    );
  }
}