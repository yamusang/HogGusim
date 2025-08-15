package com.matchpet.service;

import com.matchpet.config.ExternalAnimalProperties;
import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.animal.repository.AnimalRepository;
import com.matchpet.domain.shelter.entity.Shelter;                 // ← entity 패키지
import com.matchpet.domain.shelter.repository.ShelterRepository;  // ← repository 패키지
import com.matchpet.dto.AnimalApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnimalIngestService {

  private final AnimalRepository animalRepo;
  private final ShelterRepository shelterRepo;
  private final WebClient animalWebClient;            // WebClientConfig#animalWebClient
  private final ExternalAnimalProperties props;       // baseUrl/decodingKey/timeout

  /**
   * 공공데이터(유기동물) 기간+지역 수집 (페이지네이션 포함)
   * - desertionNo → animals.external_id 로 upsert
   * - 보호소(careNm+careAddr) → shelters.name/address 로 upsert 후 FK 연결
   *
   * @param from    시작일(YYYY-MM-DD)
   * @param to      종료일(YYYY-MM-DD)
   * @param uprCd   시/도 코드(예: 부산 6260000)
   * @param pageSize 페이지 크기(권장: 500)
   * @return insert+update 총 건수
   */
  @Transactional
  public int ingest(LocalDate from, LocalDate to, String uprCd, int pageSize) {
    int saved = 0;
    int page = 1;

    while (true) {
      // 람다 캡쳐로 인한 effectively final 문제 회피
      final int currentPage = page;

      var resp = animalWebClient.get()
          .uri(uri -> uri
              .path("/abandonmentPublic_v2")
              .queryParam("serviceKey", props.decodingKey()) // 반드시 Decoding 키
              .queryParam("bgnde", from.format(DateTimeFormatter.BASIC_ISO_DATE))
              .queryParam("endde", to.format(DateTimeFormatter.BASIC_ISO_DATE))
              .queryParam("upr_cd", uprCd)
              .queryParam("pageNo", currentPage)
              .queryParam("numOfRows", pageSize)
              .queryParam("_type", "json")
              .build())
          .accept(MediaType.APPLICATION_JSON)
          .retrieve()
          .bodyToMono(AnimalApiResponse.class)
          .block();

      var items = Optional.ofNullable(resp)
          .map(AnimalApiResponse::response).map(AnimalApiResponse.Response::body)
          .map(AnimalApiResponse.Body::items).map(AnimalApiResponse.Items::item)
          .orElse(List.of());

      if (items.isEmpty()) {
        log.info("[ingest] no items: uprCd={}, page={}, size={}", uprCd, currentPage, pageSize);
        break;
      }

      for (var it : items) {
        try {
          // ── 보호소 upsert (careNm + careAddr 기준) ──
          Shelter shelter = null;
          if (notBlank(it.careNm()) && notBlank(it.careAddr())) {
            shelter = shelterRepo.findByNameAndAddress(it.careNm(), it.careAddr())
                .orElseGet(() -> {
                  var s = new Shelter();
                  s.setName(it.careNm());
                  s.setAddress(it.careAddr());
                  return s;
                });
            // 최신화 필드
            shelter.setTel(it.careTel());
            // orgNm(지자체/기관명)을 임시로 region 필드에 보관(필요시 별도 컬럼 확장)
            shelter.setRegion(it.orgNm());
            shelter = shelterRepo.save(shelter);
          }

          // ── 동물 upsert (externalId = desertionNo) ──
          final String externalId = it.desertionNo();
          if (isBlank(externalId)) {
            // 외부키가 없으면 스킵
            continue;
          }
          var a = animalRepo.findByExternalId(externalId).orElseGet(Animal::new);
          if (a.getId() == null) a.setExternalId(externalId);

          // 원문 필드 보관
          a.setHappenDt(parse(it.happenDt()));
          a.setHappenPlace(it.happenPlace());
          a.setKindCd(it.kindCd());
          a.setColorCd(it.colorCd());
          a.setAgeText(it.age());
          a.setWeightText(it.weight());
          a.setSexCd(it.sexCd());
          a.setNeuterYn(it.neuterYn());
          a.setProcessState(it.processState());
          a.setOrgNm(it.orgNm());
          a.setPopfile(it.popfile());
          a.setSpecialMark(it.specialMark());
          a.setNoticeSdt(parse(it.noticeSdt()));
          a.setNoticeEdt(parse(it.noticeEdt()));
          a.setShelter(shelter);

          animalRepo.save(a);
          saved++;
        } catch (Exception e) {
          log.warn("[ingest] skip item desertionNo={} cause={}", it.desertionNo(), e.toString());
        }
      }

      // 다음 페이지 유무 판단
      Integer total = Optional.ofNullable(resp)
          .map(AnimalApiResponse::response).map(AnimalApiResponse.Response::body)
          .map(AnimalApiResponse.Body::totalCount).orElse(0);

      if (currentPage * pageSize >= total) break;
      page++; // ← 여기서 증가(람다에서 page 캡쳐 안 함)
    }

    log.info("[ingest] done: uprCd={}, from={}, to={}, totalUpsert={}", uprCd, from, to, saved);
    return saved;
  }

  // ───────────────── helpers ─────────────────

  private static LocalDate parse(String yyyymmdd) {
    if (yyyymmdd == null || yyyymmdd.isBlank()) return null;
    return LocalDate.parse(yyyymmdd, DateTimeFormatter.BASIC_ISO_DATE);
  }

  private static boolean notBlank(String s) { return s != null && !s.isBlank(); }
  private static boolean isBlank(String s) { return s == null || s.isBlank(); }
}
