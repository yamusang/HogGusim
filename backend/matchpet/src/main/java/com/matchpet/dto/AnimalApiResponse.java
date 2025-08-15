package com.matchpet.dto;

import java.util.List;

public record AnimalApiResponse(Response response) {
  public record Response(Body body) {}
  public record Body(Items items, Integer totalCount, Integer pageNo, Integer numOfRows) {}
  public record Items(List<Item> item) {}
  public record Item(
    String desertionNo, String happenDt, String happenPlace,
    String kindCd, String colorCd, String age, String weight,
    String sexCd, String neuterYn, String processState,
    String careNm, String careAddr, String careTel,
    String orgNm, String popfile, String specialMark,
    String noticeSdt, String noticeEdt
  ) {}
}
