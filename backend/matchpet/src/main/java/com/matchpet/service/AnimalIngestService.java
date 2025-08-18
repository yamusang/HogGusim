package com.matchpet.service;

import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.animal.repository.AnimalRepository;
import com.matchpet.external.AnimalApiClient;
import com.matchpet.external.dto.ExternalResponse;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.ToString;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * 공공데이터포털 유기동물 API → DB 적재 서비스
 * - 기간/지역 조건으로 페이지 단위 호출
 * - 유기번호(desertionNo) 기준 upsert
 * - 날짜 필드는 ExternalResponse.Item에서 이미 LocalDate로 역직렬화됨
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnimalIngestService {

    private final AnimalApiClient api;
    private final AnimalRepository animalRepository;

    @Transactional
    public IngestCounters ingest(LocalDate from, LocalDate to, String uprCd, int pageSize) {
        if (from == null || to == null) throw new IllegalArgumentException("from/to must not be null");
        if (from.isAfter(to)) throw new IllegalArgumentException("from(" + from + ") must be <= to(" + to + ")");

        IngestCounters c = new IngestCounters();
        int pageNo = 1;

        while (true) {
            ExternalResponse res = api.call(from, to, uprCd, pageNo, pageSize);

            List<ExternalResponse.Item> items = safeItems(res);
            if (items.isEmpty()) {
                log.info("수신 항목 없음. 종료 pageNo={}", pageNo);
                break;
            }

            c.total += items.size();
            for (ExternalResponse.Item it : items) {
                upsertOne(it, c);
            }

            int totalCount = safeTotalCount(res);
            int rows = safeNumOfRows(res, pageSize);
            int lastPage = (int) Math.ceil((double) totalCount / (double) rows);

            log.debug("pageNo={} 처리 완료 (lastPage={}, totalCount={}, rows={})",
                    pageNo, lastPage, totalCount, rows);

            if (pageNo >= lastPage) break;
            pageNo++;
        }

        log.info("적재 완료: {}", c);
        return c;
    }

    private void upsertOne(ExternalResponse.Item it, IngestCounters c) {
        String desertionNo = trimToNull(it.getDesertionNo());
        if (desertionNo == null) {
            log.warn("desertionNo 누락으로 skip: item={}", it);
            c.skipped++;
            return;
        }

        try {
            Optional<Animal> existing = animalRepository.findByDesertionNo(desertionNo);
            if (existing.isPresent()) {
                Animal a = existing.get();
                apply(a, it);
                // 변경감지는 @Transactional로 flush
                c.updated++;
            } else {
                Animal a = Animal.builder()
                        .desertionNo(desertionNo)
                        .build();
                apply(a, it);
                animalRepository.save(a);
                c.inserted++;
            }
        } catch (Exception e) {
            log.error("upsert 실패 desertionNo={}: {}", desertionNo, e.getMessage(), e);
            c.skipped++;
        }
    }

    /** DTO → 엔티티 매핑 (DTO의 날짜는 이미 LocalDate) */
    private void apply(Animal a, ExternalResponse.Item it) {
        a.setExternalId(trimToNull(it.getNoticeNo())); // 필요 시 다른 외부키로 교체 가능

        a.setHappenDt(it.getHappenDt());
        a.setHappenPlace(trimToNull(it.getHappenPlace()));

        a.setKindCd(trimToNull(it.getKindCd()));
        a.setColorCd(trimToNull(it.getColorCd()));
        a.setAge(trimToNull(it.getAge()));
        a.setWeight(trimToNull(it.getWeight()));

        a.setSexCd(trimToNull(it.getSexCd()));
        a.setNeuterYn(trimToNull(it.getNeuterYn()));
        a.setSpecialMark(trimToNull(it.getSpecialMark()));

        a.setCareNm(trimToNull(it.getCareNm()));
        a.setCareTel(trimToNull(it.getCareTel()));
        a.setCareAddr(trimToNull(it.getCareAddr()));

        a.setProcessState(trimToNull(it.getProcessState()));

        a.setFilename(trimToNull(it.getFilename()));
        a.setPopfile(trimToNull(it.getPopfile()));

        a.setNoticeNo(trimToNull(it.getNoticeNo()));
        a.setNoticeSdt(it.getNoticeSdt());
        a.setNoticeEdt(it.getNoticeEdt());

        a.setUprCd(trimToNull(it.getUprCd()));
        a.setOrgNm(trimToNull(it.getOrgNm()));
        a.setChargeNm(trimToNull(it.getChargeNm()));
        a.setOfficetel(trimToNull(it.getOfficetel()));
    }

    // ===== 안전 접근/유틸 =====

    private static List<ExternalResponse.Item> safeItems(ExternalResponse res) {
        if (res == null || res.getResponse() == null || res.getResponse().getBody() == null
                || res.getResponse().getBody().getItems() == null
                || res.getResponse().getBody().getItems().getItem() == null) {
            return Collections.emptyList();
        }
        return res.getResponse().getBody().getItems().getItem();
    }

    private static int safeTotalCount(ExternalResponse res) {
        try {
            Integer tc = res.getResponse().getBody().getTotalCount();
            return tc == null ? 0 : tc;
        } catch (Exception ignore) {
            return 0;
        }
    }

    private static int safeNumOfRows(ExternalResponse res, int fallback) {
        try {
            Integer n = res.getResponse().getBody().getNumOfRows();
            return (n == null || n <= 0) ? fallback : n;
        } catch (Exception ignore) {
            return fallback;
        }
    }

    private static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    // ===== 카운터 DTO =====
    @Getter @ToString
    public static class IngestCounters {
        private int total;
        private int inserted;
        private int updated;
        private int skipped;
    }
}
