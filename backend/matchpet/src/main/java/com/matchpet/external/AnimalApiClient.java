// src/main/java/com/matchpet/external/AnimalApiClient.java
package com.matchpet.external;

import com.matchpet.config.AnimalApiProps;
import com.matchpet.external.dto.ExternalResponse;
import com.fasterxml.jackson.databind.json.JsonMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Slf4j
@Component
@RequiredArgsConstructor
public class AnimalApiClient {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

    @Qualifier("externalWebClient")
    private final WebClient externalWebClient;
    private final AnimalApiProps props;

    /** region 은 "부산" 등 한글, 필요 시 upr_cd 로 매핑 */
    public ExternalResponse fetch(String region, LocalDate from, LocalDate to, int page, int size) {
        final String bgnde = from.format(DATE);
        final String endde = to.format(DATE);
        final int pageNo = Math.max(page, 1);
        final String uprCd = mapToUprCd(region);

        // 1) ✅ Decoding Key 원문만 사용 (추가 인코딩 금지)
        final String serviceKey = safeTrim(props.getDecodingKey());
        if (serviceKey.isBlank()) {
            throw new IllegalStateException("API key not configured (ANIMAL_DECODING_KEY).");
        }

        // 2) ✅ v2 고정 경로: {base}/abandonmentPublic
        //    base 예) https://apis.data.go.kr/1543061/abandonmentPublicService_v2
        String base = normalizeBase(props.getBaseUrl());

        UriComponentsBuilder ub = UriComponentsBuilder
                .fromUriString(base)
                .path("/abandonmentPublic_v2")
                .queryParam("serviceKey", serviceKey)  // Decoding Key (원문)
                .queryParam("bgnde", bgnde)
                .queryParam("endde", endde)
                .queryParam("pageNo", pageNo)
                .queryParam("numOfRows", size)
                .queryParam("returnType", "JSON");      // ✅ v2 권장 파라미터

        if (uprCd != null && !uprCd.isBlank()) {
            ub.queryParam("upr_cd", uprCd);
        }

        // build(false) == 미인코딩 상태로 간주 → 필요한 부분만 적절히 인코딩됨
        URI uri = ub.build(false).toUri();

        Raw raw = invoke(uri, maskKey(uri.toString(), serviceKey));
        if (raw.status >= 400) {
            throw new RuntimeException("[animal-api] HTTP " + raw.status + " " + raw.body);
        }

        // 공공데이터 에러는 200 + <OpenAPI_ServiceResponse> 로 오는 경우가 있어 필터링
        String body = raw.body == null ? "" : raw.body.trim();
        if (!(body.startsWith("{") || body.startsWith("[")) || body.contains("<OpenAPI_ServiceResponse>")) {
            throw new RuntimeException("[animal-api] G/W error or non-JSON: " + snippet(body));
        }

        try {
            ExternalResponse parsed = JsonMapper.builder().findAndAddModules().build()
                    .readValue(body, ExternalResponse.class);
            return parsed;
        } catch (Exception e) {
            throw new RuntimeException("[animal-api] JSON parse failed: " + e.getMessage() + " body=" + snippet(body));
        }
    }

    /** 실제 호출 */
    private Raw invoke(URI uri, String safeUriForLog) {
        log.info("[animal-api] TRY {}", safeUriForLog);
        try {
            var respMono = externalWebClient.get()
                    .uri(uri)
                    .accept(MediaType.APPLICATION_JSON)
                    .exchangeToMono(resp ->
                            resp.bodyToMono(String.class)
                                    .defaultIfEmpty("")
                                    .map(body -> new Raw(resp.rawStatusCode(), body))
                    );
            Raw raw = respMono.block(Duration.ofMillis(props.getTimeoutMs()));
            if (raw == null) return new Raw(599, "empty");
            if (raw.status >= 400) {
                log.warn("[animal-api] FAIL {} | {} | {}", raw.status, safeUriForLog, snippet(raw.body));
            }
            return raw;
        } catch (Exception e) {
            throw new RuntimeException("[animal-api] call failed: " + e.getMessage());
        }
    }

    private static String safeTrim(String s) { return s == null ? "" : s.trim(); }

    private static String normalizeBase(String base) {
        if (base == null) throw new IllegalStateException("external.animal.base-url missing");
        // 뒤에 슬래시 있으면 제거 (중복 슬래시 방지)
        return base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
    }

    /** 부산 등 지역명을 upr_cd로 변환 (없으면 null) */
    private static String mapToUprCd(String region) {
        if (region == null) return null;
        String r = region.trim();
        if (r.isEmpty()) return null;
        if (r.contains("부산")) return "6260000";
        return null;
    }

    private static String maskKey(String uri, String key) {
        String masked = key.substring(0, Math.min(6, key.length())) + "****";
        return uri.replace(key, masked);
    }

    private static String snippet(String body) {
        if (body == null) return "null";
        String t = body.trim();
        return t.length() > 300 ? t.substring(0, 300) + "..." : t;
    }

    private record Raw(int status, String body) {}
}
