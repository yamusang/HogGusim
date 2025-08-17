// src/main/java/com/matchpet/domain/stats/service/RescueStatsIngestService.java
package com.matchpet.domain.stats.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.matchpet.domain.stats.entity.RescueStat;
import com.matchpet.domain.stats.repository.RescueStatRepository;
import com.matchpet.external.RescueStatsApiClient;
import com.matchpet.external.dto.RescueStatsResponse;
import lombok.RequiredArgsConstructor;
import lombok.Value;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RescueStatsIngestService {

    private final RescueStatsApiClient api;
    private final RescueStatRepository repo;
    private final ObjectMapper om = new ObjectMapper();

    @Value
    public static class Counters {
        int fetched;
        int inserted;
        int skipped;
    }

    @Transactional
    public Counters ingest(
            String bgnde, String endde,
            String uprCd, String orgCd, String careRegNo,
            int pageSize
    ) {
        int page = 1;
        int fetched = 0, inserted = 0, skipped = 0;
        final int SAFE_MAX_PAGES = 5000;

        while (page <= SAFE_MAX_PAGES) {
            RescueStatsResponse r = api.fetch(bgnde, endde, uprCd, orgCd, careRegNo, page, pageSize, "json");
            if (r == null || r.getResponse() == null || r.getResponse().getBody() == null) break;

            List<Map<String, Object>> items = Optional.ofNullable(r.getResponse().getBody().getItems())
                    .map(RescueStatsResponse.Items::getItem)
                    .orElse(List.of());
            if (items.isEmpty()) break;

            fetched += items.size();

            for (Map<String, Object> item : items) {
                try {
                    String payload = om.writeValueAsString(item);
                    String hash = sha256(payload);

                    if (repo.findByItemHash(hash).isPresent()) {
                        skipped++;
                        continue;
                    }

                    RescueStat e = new RescueStat();
                    e.setItemHash(hash);
                    e.setPayload(payload);

                    // 자주 쓰는 키만 안전하게 추출 (없어도 무시)
                    e.setStatYmd(getStr(item, "stdrYmd", "ymd", "dt", "date"));
                    e.setUprCd(getStr(item, "uprCd", "upr_cd"));
                    e.setOrgCd(getStr(item, "orgCd", "org_cd"));
                    e.setCareRegNo(getStr(item, "careRegNo", "care_reg_no"));

                    // 통계 카테고리/값 가능하면 추출 (예: rescueCnt, adoptCnt 등)
                    String category = firstExistingKey(item, "rescueCnt","adoptCnt","euthanasiaCnt","returnCnt","protectCnt","noticeCnt","totalCnt","cnt","value");
                    e.setCategory(category);
                    e.setCnt(category == null ? null : toInt(item.get(category)));

                    repo.save(e);
                    inserted++;
                } catch (JsonProcessingException ex) {
                    log.warn("payload 직렬화 실패: {}", ex.getMessage());
                    skipped++;
                } catch (Exception ex) {
                    log.warn("항목 저장 실패: {}", ex.getMessage());
                    skipped++;
                }
            }

            Integer total = Optional.ofNullable(r.getResponse().getBody().getTotalCount()).orElse(0);
            Integer num   = Optional.ofNullable(r.getResponse().getBody().getNumOfRows()).orElse(pageSize);
            int maxPage   = (int)Math.ceil((double)total / (double)num);

            if (page >= maxPage) break;
            page++;
        }

        return new Counters(fetched, inserted, skipped);
    }

    private static String sha256(String s) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] dig = md.digest(s.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : dig) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static String getStr(Map<String, Object> m, String... keys) {
        for (String k : keys) {
            Object v = m.get(k);
            if (v != null && !v.toString().isBlank()) return v.toString();
        }
        return null;
    }

    private static String firstExistingKey(Map<String, Object> m, String... keys) {
        for (String k : keys) if (m.containsKey(k)) return k;
        return null;
    }

    private static Integer toInt(Object o) {
        if (o == null) return null;
        try { return Integer.parseInt(o.toString()); } catch (Exception e) { return null; }
    }
}
