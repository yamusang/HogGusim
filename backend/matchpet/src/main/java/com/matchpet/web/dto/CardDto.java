package com.matchpet.web.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Builder;

@Builder

public record CardDto(
  String desertionNo,
  LocalDate happenDt,
  String kindCd,
  String colorCd,
  String sexCd,
  String neuterYn,
  String processState,
  String filename,
  String popfile,
  String careNm,
  String careTel,
  String careAddr,
  String specialMark,
  String noticeSdt,
  String noticeEdt,
  String orgNm,
  LocalDateTime createdAt
) {}
