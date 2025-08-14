package com.matchpet.domain.animal.service;

import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.animal.enums.AnimalStatus;
import com.matchpet.domain.animal.enums.NeuterStatus;
import com.matchpet.domain.animal.enums.Sex;
import com.matchpet.domain.animal.repository.AnimalRepository;
import com.matchpet.domain.shelter.entity.Shelter;
import com.matchpet.domain.shelter.repository.ShelterRepository;
import com.matchpet.external.AnimalApiClient;
import com.matchpet.external.dto.ExternalResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExternalAnimalIngestService {

  private final AnimalApiClient api;
  private final AnimalRepository animalRepo;
  private final ShelterRepository shelterRepo;

  /** 한 페이지 업서트. 아이템이 없으면 0 반환 */
  @Transactional
  public int ingest(String region, LocalDate from, LocalDate to, int page, int size) {
    final int pageNo = Math.max(page, 1);
    ExternalResponse res = api.fetch(region, from, to, pageNo, size);

    if (res == null || res.items() == null || res.items().isEmpty()) {
      log.info("[ingest] no items: region={}, page={}, size={}", region, pageNo, size);
      return 0;
    }

    int upsert = 0;
    Map<String, Shelter> shelterCache = new HashMap<>();

    for (ExternalResponse.ExternalAnimal ea : res.items()) {
      if (ea == null) continue;

      final String extAnimalId  = nvl(ea.id());
      final String extShelterId = nvl(ea.shelterId());
      if (extAnimalId.isBlank() || extShelterId.isBlank()) {
        log.warn("[ingest] skip item: missing external ids (animalId={}, shelterId={})",
            extAnimalId, extShelterId);
        continue;
      }

      try {
        // 1) 보호소 업서트(+ 캐시)
        Shelter sh = shelterCache.computeIfAbsent(extShelterId, id -> upsertShelter(ea));

        // 2) 동물 업서트
        Animal a = animalRepo.findByExternalId(extAnimalId).orElseGet(Animal::new);
        if (a.getId() == null) a.setExternalId(extAnimalId);

        // 성별/중성화/상태 매핑
        Sex sex = mapSex(ea.sex());
        a.setSex(sex);
        a.setNeuterStatus(mapNeuter(ea.neuter(), sex));
        a.setStatus(mapStatus(ea.status()));

        // 기본 속성
        a.setShelter(sh);
        a.setSpecies(trim(ea.species()));
        a.setBreed(extractBreedFromKind(ea.species())); // kindCd에서 품종만 추출
        a.setColor(trim(ea.color()));
        a.setIntakeDate(ea.intakeDate());
        a.setThumbnailUrl(trim(ea.thumb()));
        a.setDescription(trim(ea.desc()));
        // 원본 이미지까지 저장하려면 아래 주석 해제
        // a.setImageUrl(trim(ea.image()));

        // 나이/체중 파싱
        // a.setAgeMonths(parseAgeMonths(ea.ageText()));             // "2023(년생)" → 개월 수
        // BigDecimal weight = parseWeightKg(ea.weightText());       // "5(Kg)" → 5
        // if (weight != null) a.setWeightKg(weight);

        // // 지역 우선순위: 보호소.region → 응답.region
        // a.setRegion(firstNonBlank(sh.getRegion(), ea.region()));

        animalRepo.save(a);
        upsert++;
      } catch (Exception ex) {
        log.warn("[ingest] skip item={} cause={}", extAnimalId, ex.toString());
      }
    }

    log.info("[ingest] done: region={}, page={}, size={}, upsert={}", region, pageNo, size, upsert);
    return upsert;
  }

  /** 전체 페이지 반복 수집 (자기호출 트랜잭션 꼬임 방지: 클래스 레벨 트랜잭션 사용 안 함) */
  public int ingestAll(String region, LocalDate from, LocalDate to, int pageSize) {
    int total = 0;
    int page = 1; // 1부터 시작 권장
    while (true) {
      int cnt = ingest(region, from, to, page, pageSize);
      if (cnt <= 0) break;
      total += cnt;
      page++;
    }
    log.info("[ingestAll] done: region={}, totalUpsert={}, pages={}", region, total, page - 1);
    return total;
  }

  // ───────────── helpers ─────────────

  private Shelter upsertShelter(ExternalResponse.ExternalAnimal ea) {
    String extShelterId = nvl(ea.shelterId());
    Optional<Shelter> found = shelterRepo.findByExternalId(extShelterId);

    Shelter s = found.orElseGet(() -> {
      Shelter ns = new Shelter();
      ns.setExternalId(extShelterId);
      return ns;
    });

    s.setName(trim(ea.shelterName()));
    s.setTel(trim(ea.shelterTel()));
    s.setAddress(trim(ea.shelterAddr()));
    s.setRegion(trim(ea.region()));
    if (ea.lat() != null) s.setLat(BigDecimal.valueOf(ea.lat()));
    if (ea.lng() != null) s.setLng(BigDecimal.valueOf(ea.lng()));

    return shelterRepo.save(s);
  }

  private Sex mapSex(String code) {
    if (code == null) return Sex.UNKNOWN;
    switch (code.trim().toUpperCase()) {
      case "M", "MALE", "남", "수컷": return Sex.MALE;
      case "F", "FEMALE", "여", "암컷": return Sex.FEMALE;
      default: return Sex.UNKNOWN;
    }
  }

  /**
   * 외부코드가 'Y'/'N'만 내려오는 경우 성별 기반 파생:
   *  - Y: FEMALE → SPAYED, 그 외 → NEUTERED
   */
  private NeuterStatus mapNeuter(String code, Sex sex) {
    if (code == null) return NeuterStatus.UNKNOWN;
    String c = code.trim().toUpperCase();
    switch (c) {
      case "S": case "SPAYED": return NeuterStatus.SPAYED;
      case "C": case "NEUTERED": return NeuterStatus.NEUTERED; // C: Castrated
      case "Y": case "YES": case "T": case "TRUE": case "1":
        return (sex == Sex.FEMALE ? NeuterStatus.SPAYED : NeuterStatus.NEUTERED);
      case "N": case "NO": case "F": case "FALSE": case "0": case "U": case "UNKNOWN":
      default: return NeuterStatus.UNKNOWN;
    }
  }

  /** 공공데이터 한글 상태 포함 매핑 */
  private AnimalStatus mapStatus(String code) {
    if (code == null || code.isBlank()) return AnimalStatus.AVAILABLE;
    String c = code.trim();

    // 한글 우선 처리
    switch (c) {
      case "공고중": return AnimalStatus.AVAILABLE;   // 공고 진행
      case "보호중": return AnimalStatus.PENDING;     // 보호/대기
      case "입양완료":
      case "종료":
      case "반환":
      case "자연사":
      case "안락사":
        return AnimalStatus.ADOPTED;                  // 내부상 '종료'를 ADOPTED로 묶음
    }

    // 영문/코드 처리
    switch (c.toUpperCase()) {
      case "A": case "AVAILABLE": case "OPEN":    return AnimalStatus.AVAILABLE;
      case "P": case "PENDING":                   return AnimalStatus.PENDING;
      case "M": case "MATCHED": case "RESERVED":  return AnimalStatus.MATCHED;
      case "D": case "ADOPTED": case "CLOSED":    return AnimalStatus.ADOPTED;
      default: return AnimalStatus.AVAILABLE;
    }
  }

  private static String nvl(String v) { return v == null ? "" : v; }
  private static String trim(String v) { return v == null ? null : v.trim(); }
  private static String firstNonBlank(String a, String b) {
    if (a != null && !a.isBlank()) return a;
    if (b != null && !b.isBlank()) return b;
    return null;
  }

  /** kindCd 예: "[개] 믹스견" → "믹스견" */
  private String extractBreedFromKind(String kindCd) {
    if (kindCd == null) return null;
    int idx = kindCd.indexOf(']');
    String s = (idx >= 0 && idx + 1 < kindCd.length()) ? kindCd.substring(idx + 1) : kindCd;
    return s == null ? null : s.trim();
  }

  /** "2023(년생)" / "2살" / "6(개월)" → 개월 수(대략치) */
  private Integer parseAgeMonths(String ageText) {
    if (ageText == null || ageText.isBlank()) return null;
    String t = ageText.replaceAll("\\s", "");
    try {
      if (t.contains("년생")) {
        String yearStr = t.replaceAll("[^0-9]", "");
        if (!yearStr.isEmpty()) {
          int birthYear = Integer.parseInt(yearStr);
          int years = Math.max(0, LocalDate.now().getYear() - birthYear);
          return years * 12;
        }
      } else if (t.contains("개월")) {
        String m = t.replaceAll("[^0-9]", "");
        return m.isEmpty() ? null : Integer.parseInt(m);
      } else if (t.contains("살")) {
        String y = t.replaceAll("[^0-9]", "");
        int years = y.isEmpty() ? 0 : Integer.parseInt(y);
        return years * 12;
      }
    } catch (Exception ignore) {}
    return null;
  }

  /** "5(Kg)" / "5.2Kg" → 5, 5.2 */
  private BigDecimal parseWeightKg(String weightText) {
    if (weightText == null || weightText.isBlank()) return null;
    String num = weightText.replaceAll("[^0-9.]", "");
    if (num.isEmpty()) return null;
    try {
      return new BigDecimal(num);
    } catch (NumberFormatException e) {
      return null;
    }
  }
}
