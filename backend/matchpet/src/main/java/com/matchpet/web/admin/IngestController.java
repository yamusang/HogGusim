package com.matchpet.web.admin;

import com.matchpet.service.AnimalIngestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/internal/ingest")
public class IngestController {

    private static final DateTimeFormatter BASIC = DateTimeFormatter.BASIC_ISO_DATE;
    
    private final AnimalIngestService ingestService;

    @PostMapping("/animals")
    public ResponseEntity<Map<String, Object>> ingest(@RequestParam String from,
                                                      @RequestParam String to,
                                                      @RequestParam(required = false, name = "region") String uprCd,
                                                      @RequestParam(defaultValue = "500", name = "pageSize") int pageSize) {
        LocalDate f = parseDateFlexible(from);
        LocalDate t = parseDateFlexible(to);
        var c = ingestService.ingest(f, t, uprCd, Math.min(pageSize, 1000));
        return ResponseEntity.ok(Map.of(
                "status", "OK",
                "total", c.getTotal(),
                "inserted", c.getInserted(),
                "updated", c.getUpdated()
        ));
    }

    /** yyyy-MM-dd 또는 yyyyMMdd 허용 */
    private static LocalDate parseDateFlexible(String input) {
        String s = input.trim();
        if (s.length() == 8 && s.chars().allMatch(Character::isDigit)) {
            return LocalDate.parse(s, BASIC);
        }
        return LocalDate.parse(s); // yyyy-MM-dd
    }
}
