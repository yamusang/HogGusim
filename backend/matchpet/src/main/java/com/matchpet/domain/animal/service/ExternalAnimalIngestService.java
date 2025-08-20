package com.matchpet.domain.animal.service;

import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.animal.repository.AnimalRepository;
import com.matchpet.external.AnimalApiClient;
import com.matchpet.external.dto.ExternalResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExternalAnimalIngestService {

    private final AnimalApiClient api;
    private final AnimalRepository animalRepo;

    @Transactional
    public IngestCounters ingest(LocalDate from, LocalDate to, String uprCd, int pageSize) {
        int page = 1, inserted = 0, updated = 0, total = 0;

        while (true) {
            ExternalResponse res = api.call(from, to, uprCd, page, pageSize);
            if (res == null || res.getResponse() == null || res.getResponse().getBody() == null) break;

            ExternalResponse.Body body = res.getResponse().getBody();
            List<ExternalResponse.Item> items = (body.getItems() != null) ? body.getItems().getItem() : null;
            if (items == null || items.isEmpty()) break;

            for (ExternalResponse.Item it : items) {
                total++;

                // 1) 외부키(externalId) 생성 (null 금지)
                String externalId = toExternalId(it);
                if (externalId == null) {
                    log.warn("[SKIP] cannot build externalId: desertionNo={}, orgNm={}, noticeNo={}, filename={}",
                            it.getDesertionNo(), it.getOrgNm(), it.getNoticeNo(), it.getFilename());
                    continue;
                }

                // 2) externalId로 1차 업서트 조회
                Optional<Animal> existingOpt = animalRepo.findByExternalId(externalId);

                // 3) 과거 데이터 호환: desertionNo로 보조 매칭 후 externalId 백필
                if (existingOpt.isEmpty()) {
                    String dn = trimToNull(it.getDesertionNo());
                    if (dn != null) {
                        Optional<Animal> byDn = animalRepo.findByDesertionNo(dn);
                        if (byDn.isPresent()) {
                            Animal fix = byDn.get();
                            if (fix.getExternalId() == null) {
                                fix.setExternalId(externalId); // 과거 행 보정
                            }
                            existingOpt = Optional.of(fix);
                        }
                    }
                }

                if (existingOpt.isPresent()) {
                    Animal a = existingOpt.get();
                    apply(a, it);
                    a.setDesertionNo(trimToNull(it.getDesertionNo())); // 보조 필드 갱신
                    updated++;
                } else {
                    Animal a = new Animal();
                    a.setExternalId(externalId);                       // ★ NOT NULL + UNIQUE
                    a.setDesertionNo(trimToNull(it.getDesertionNo())); // 보조 필드
                    apply(a, it);
                    animalRepo.save(a);
                    inserted++;
                }
            }

            // 페이징 종료 판정
            Integer totalCount = body.getTotalCount();
            Integer numOfRows  = body.getNumOfRows();
            Integer pageNo     = body.getPageNo();
            if (numOfRows == null || pageNo == null || totalCount == null) {
                if (items.size() < pageSize) break; // 안전 종료
            } else {
                int totalPages = (int) Math.ceil(totalCount / (double) numOfRows);
                if (pageNo >= totalPages) break;
            }
            page++;
        }

        log.info("Ingest finished. total={}, inserted={}, updated={}", total, inserted, updated);
        return new IngestCounters(total, inserted, updated);
    }

    /** 외부 → 엔티티 매핑 */
    private static void apply(Animal a, ExternalResponse.Item it) {
        a.setHappenDt(it.getHappenDt());
        a.setHappenPlace(it.getHappenPlace());
        a.setKindCd(it.getKindCd());
        a.setColorCd(it.getColorCd());
        a.setAge(it.getAge());
        a.setWeight(it.getWeight());
        a.setSexCd(it.getSexCd());
        a.setNeuterYn(it.getNeuterYn());
        a.setSpecialMark(it.getSpecialMark());
        a.setCareNm(it.getCareNm());
        a.setCareTel(it.getCareTel());
        a.setCareAddr(it.getCareAddr());
        a.setProcessState(it.getProcessState());
        a.setFilename(it.getFilename());
        a.setPopfile(it.getPopfile());
        a.setNoticeNo(it.getNoticeNo());
        a.setNoticeSdt(it.getNoticeSdt());
        a.setNoticeEdt(it.getNoticeEdt());
        a.setUprCd(it.getUprCd());
        a.setOrgNm(it.getOrgNm());
        a.setChargeNm(it.getChargeNm());
        a.setOfficetel(it.getOfficetel());
    }

    /** 외부 레코드에서 내부 고유키(externalId) 생성: desertionNo 우선, 없으면 해시 */
    private static String toExternalId(ExternalResponse.Item it) {
    String dn = trimToNull(it.getDesertionNo());
    if (dn != null) return dn; // ★ prefix 제거

    String base = String.join("|",
        nullToEmpty(asYmd(it.getHappenDt())),
        nullToEmpty(it.getOrgNm()),
        nullToEmpty(it.getNoticeNo()),
        nullToEmpty(it.getKindCd()),
        nullToEmpty(it.getFilename()),
        nullToEmpty(it.getPopfile())
    );
    String h = sha1(base);
    return (h == null || h.isBlank()) ? null : "H:" + h; // or just h
}

    private static String asYmd(LocalDate d) { return (d == null) ? null : d.toString().replace("-", ""); }
    private static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
    private static String nullToEmpty(String s) { return (s == null) ? "" : s; }

    private static String sha1(String s) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] digest = md.digest(s.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }

    @Getter @AllArgsConstructor
    public static class IngestCounters {
        private final int total;
        private final int inserted;
        private final int updated;
    }
}
