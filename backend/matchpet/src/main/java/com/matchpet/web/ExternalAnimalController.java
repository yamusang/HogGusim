// src/main/java/com/matchpet/web/ExternalAnimalController.java
package com.matchpet.web;

import com.matchpet.external.AnimalApiClient;
import com.matchpet.external.dto.ExternalResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/external/animals")
@RequiredArgsConstructor
public class ExternalAnimalController {

  private final AnimalApiClient api;

  @GetMapping
  public List<CardDto> list(
      @RequestParam String region,                                   // 예: 부산
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "20") int size
  ) {
    ExternalResponse res = api.fetch(region, from, to, page, size);
    return res.items().stream().map(this::toCard).toList();
  }

  private CardDto toCard(ExternalResponse.ExternalAnimal ea) {
    // kindCd는 "[개] 믹스견" 형태 → 종/품종 분리
    String species = extractSpeciesFromKind(ea.species());
    String breed   = extractBreedFromKind(ea.species());

    return new CardDto(
        ea.id(),
        ea.thumb(),                 // 썸네일
        species,
        breed,
        sexLabel(ea.sex()),
        neuterLabel(ea.neuter()),
        ea.intakeDate() != null ? ea.intakeDate().toString() : null,
        ea.color(),
        normalizeStatus(ea.status()),
        ea.shelterName()
    );
  }

  private String extractSpeciesFromKind(String kindCd) {
    if (kindCd == null) return null;
    int l = kindCd.indexOf('['), r = kindCd.indexOf(']');
    if (l >= 0 && r > l) return kindCd.substring(l + 1, r).trim(); // 대괄호 안
    return kindCd;
  }

  private String extractBreedFromKind(String kindCd) {
    if (kindCd == null) return null;
    int r = kindCd.indexOf(']');
    if (r >= 0 && r + 1 < kindCd.length()) return kindCd.substring(r + 1).trim();
    return kindCd;
  }

  private String sexLabel(String code) {
    if (code == null) return "미상";
    return switch (code.trim().toUpperCase()) {
      case "M", "MALE", "남", "수컷" -> "수컷";
      case "F", "FEMALE", "여", "암컷" -> "암컷";
      default -> "미상";
    };
  }

  private String neuterLabel(String code) {
    if (code == null) return "미상";
    return switch (code.trim().toUpperCase()) {
      case "Y", "YES", "T", "SPAYED", "NEUTERED" -> "중성화";
      case "N", "NO", "F" -> "미중성화";
      default -> "미상";
    };
  }

  private String normalizeStatus(String s) {
    if (s == null || s.isBlank()) return "AVAILABLE";
    // 공공데이터 한글 상태 보정
    return switch (s.trim()) {
      case "공고중" -> "AVAILABLE";
      case "보호중" -> "PENDING";
      case "입양완료", "종료", "반환", "자연사", "안락사" -> "ADOPTED";
      default -> s;
    };
  }

  public record CardDto(
      String id,
      String thumbnailUrl,
      String species,
      String breed,
      String sexLabel,
      String neuterLabel,
      String intakeDate,
      String color,
      String status,
      String shelterName
  ) {}
}
