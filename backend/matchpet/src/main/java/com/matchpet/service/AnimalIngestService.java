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

import java.lang.reflect.Method;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnimalIngestService {

    private final AnimalApiClient api;
    private final AnimalRepository repo;

    @Transactional
    public IngestCounters ingest(LocalDate from, LocalDate to, String uprCd, int pageSize) {
        IngestCounters c = new IngestCounters();
        int pageNo = 1;

        while (true) {
            ExternalResponse res = api.call(from, to, uprCd, pageNo, pageSize);
            List<ExternalResponse.Item> items = safeItems(res);
            if (items.isEmpty()) {
                log.info("no items; stop at pageNo={}", pageNo);
                break;
            }

            c.total += items.size();
            for (ExternalResponse.Item it : items) {
                upsertOne(it, c);
            }

            int totalCount = safeInt(() -> res.getResponse().getBody().getTotalCount(), 0);
            int rows       = safeInt(() -> res.getResponse().getBody().getNumOfRows(), pageSize);
            int lastPage   = (int) Math.ceil((double) totalCount / Math.max(1, rows));
            if (pageNo >= lastPage) break;
            pageNo++;
        }

        log.info("ingest done: {}", c);
        return c;
    }

    private void upsertOne(ExternalResponse.Item it, IngestCounters c) {
    // 외부 키 구성
    String desertionNo = trimToNull(it.getDesertionNo());
    String externalId  = buildExternalId(it, desertionNo);
    if (externalId == null) { c.skipped++; return; }

    // 1) desertion_no 우선 조회 (중복키 방지)
    Animal a = null;    
    if (desertionNo != null) {
        a = repo.findByDesertionNo(desertionNo).orElse(null);
    }
    // 2) external_id 로도 조회
    if (a == null) {
        a = repo.findByExternalId(externalId).orElse(null);
    }

    // 3) 없으면 신규, 있으면 갱신
    boolean isNew = false;
    if (a == null) {
        a = new Animal();
        isNew = true;
        a.setExternalId(externalId);
        a.setDesertionNo(desertionNo); // 있을 때만
    } else {
        // 키 동기화(기존 행이 예전에 다른 external_id로 들어간 경우 보정)
        if (a.getExternalId() == null || !a.getExternalId().equals(externalId)) {
            a.setExternalId(externalId);
        }
        if (desertionNo != null && (a.getDesertionNo() == null || !a.getDesertionNo().equals(desertionNo))) {
            a.setDesertionNo(desertionNo);
        }
    }

    // ===== 기본 =====
    a.setHappenDt(it.getHappenDt());
    a.setHappenPlace(trimToNull(it.getHappenPlace()));

    a.setKindCd(trimToNull(it.getKindCd()));
    a.setColorCd(trimToNull(it.getColorCd()));

    a.setAge(trimToNull(it.getAge()));
    a.setWeight(trimToNull(it.getWeight()));

    a.setSexCd(trimToNull(it.getSexCd()));
    a.setNeuterYn(trimToNull(it.getNeuterYn()));
    a.setProcessState(trimToNull(it.getProcessState()));
    a.setSpecialMark(trimToNull(it.getSpecialMark()));

    // ===== 보호소/기관 =====
    a.setCareNm(trimToNull(it.getCareNm()));
    a.setCareTel(trimToNull(it.getCareTel()));
    a.setCareAddr(trimToNull(it.getCareAddr()));
    a.setOrgNm(trimToNull(it.getOrgNm()));
    a.setChargeNm(trimToNull(getStringViaReflection(it, "getCareOwnerNm"))); // 있으면 사용

    // ===== 공고 =====
    a.setNoticeNo(trimToNull(it.getNoticeNo()));
    a.setNoticeSdt(it.getNoticeSdt());
    a.setNoticeEdt(it.getNoticeEdt());

    // ===== 이미지/파일명 =====
    String p1 = trimToNull(getStringViaReflection(it, "getPopfile1"));
    String p2 = trimToNull(getStringViaReflection(it, "getPopfile2"));
    String chosen = firstNonBlank(p1, p2);
    if (chosen != null) {
        a.setPopfile(chosen);
        a.setFilename(extractFileName(chosen));
    } else if (a.getPopfile() == null) {
        a.setFilename(null);
    }

    repo.save(a);
    if (isNew) c.inserted++; else c.updated++;
}

    // ===== 안전 접근 유틸 =====
    private static List<ExternalResponse.Item> safeItems(ExternalResponse res) {
        try {
            if (res == null) return Collections.emptyList();
            var body = res.getResponse().getBody();
            if (body == null || body.getItems() == null || body.getItems().getItem() == null) {
                return Collections.emptyList();
            }
            return body.getItems().getItem();
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private static int safeInt(IntSupplier s, int def) {
        try { Integer v = s.getAsInt(); return v == null ? def : v; } catch (Exception e) { return def; }
    }

    @FunctionalInterface
    private interface IntSupplier { Integer getAsInt(); }

    private static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static String firstNonBlank(String... arr) {
        if (arr == null) return null;
        for (String s : arr) {
            if (s != null && !s.isBlank()) return s.trim();
        }
        return null;
    }

    private static String extractFileName(String urlOrName) {
        if (urlOrName == null) return null;
        String s = urlOrName.trim();
        int q = s.indexOf('?'); if (q > -1) s = s.substring(0, q);
        int slash = s.lastIndexOf('/');
        return (slash > -1) ? s.substring(slash + 1) : s;
    }

    private static String buildExternalId(ExternalResponse.Item it, String desertionNo) {
        // desertionNo 최우선. 없으면 orgNm / noticeNo 중 하나라도 사용
        if (desertionNo != null) return desertionNo;
        String org = trimToNull(it.getOrgNm());
        String nn  = trimToNull(it.getNoticeNo());
        return firstNonBlank(org, nn);
    }

    /** DTO에 해당 getter가 없을 수도 있으므로 리플렉션으로 안전 접근 */
    private static String getStringViaReflection(Object obj, String getterName) {
        try {
            Method m = obj.getClass().getMethod(getterName);
            Object v = m.invoke(obj);
            return v != null ? v.toString() : null;
        } catch (Exception ignored) {
            return null;
        }
    }

    @Getter @ToString
    public static class IngestCounters {
        private int total;
        private int inserted;
        private int updated;
        private int skipped;
    }
}
