package com.matchpet.web.admin;

import com.matchpet.domain.animal.service.ExternalAnimalIngestService;
import lombok.RequiredArgsConstructor;
import lombok.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/internal/ingest")
public class IngestController {

    private final ExternalAnimalIngestService ingestService;

    /**
     * 적재 트리거
     * 예: POST /api/internal/ingest/animals?from=2025-08-01&to=2025-08-14&region=6260000&pageSize=500
     */
    @PostMapping("/animals")
    public ResponseEntity<Result> ingest(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(name = "region", required = false) String uprCd,
            @RequestParam(name = "pageSize", defaultValue = "500") int pageSize
    ) {
        LocalDate f = ExternalAnimalIngestService.parseDateFlexible(from);
        LocalDate t = ExternalAnimalIngestService.parseDateFlexible(to);
        if (uprCd == null || uprCd.isBlank()) uprCd = "6260000"; // 기본: 부산광역시

        var c = ingestService.ingest(f, t, uprCd, Math.min(pageSize, 1000));
        return ResponseEntity.ok(new Result("OK", "total=%d, inserted=%d, updated=%d".formatted(
                c.getTotal(), c.getInserted(), c.getUpdated()
        )));
    }

    @Value
    public static class Result {
        String status;
        String message;
    }
}
