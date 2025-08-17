// src/main/java/com/matchpet/web/RescueStatsController.java
package com.matchpet.web;

import com.matchpet.domain.stats.service.RescueStatsIngestService;
import com.matchpet.external.RescueStatsApiClient;
import com.matchpet.external.dto.RescueStatsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class RescueStatsController {

    private final RescueStatsApiClient external;
    private final RescueStatsIngestService ingestService;

    /** 외부 API 원본 조회 프록시(확인용) */
    @GetMapping("/external/rescue-stats")
    public ResponseEntity<RescueStatsResponse> getStats(
            @RequestParam String bgnde,
            @RequestParam String endde,
            @RequestParam(required = false, name = "upr_cd") String uprCd,
            @RequestParam(required = false, name = "org_cd") String orgCd,
            @RequestParam(required = false, name = "care_reg_no") String careRegNo,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "10") int numOfRows
    ) {
        return ResponseEntity.ok(
                external.fetch(bgnde, endde, uprCd, orgCd, careRegNo, pageNo, numOfRows, "json")
        );
    }

    /** DB 적재 트리거 */
    @PostMapping("/internal/ingest/rescue-stats")
    public ResponseEntity<?> ingest(
            @RequestParam String bgnde,
            @RequestParam String endde,
            @RequestParam(required = false, name = "upr_cd") String uprCd,
            @RequestParam(required = false, name = "org_cd") String orgCd,
            @RequestParam(required = false, name = "care_reg_no") String careRegNo,
            @RequestParam(defaultValue = "500", name = "pageSize") int pageSize
    ) {
        pageSize = Math.min(1000, Math.max(1, pageSize));
        var c = ingestService.ingest(bgnde, endde, uprCd, orgCd, careRegNo, pageSize);
        return ResponseEntity.ok(new Result("OK",
                String.format("fetched=%d, inserted=%d, skipped=%d", c.getFetched(), c.getInserted(), c.getSkipped())));
    }

    record Result(String status, String message) {}
}
