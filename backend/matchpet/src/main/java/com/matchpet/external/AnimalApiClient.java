package com.matchpet.external;

import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.util.UriUtils;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.matchpet.config.AnimalApiProps;
import com.matchpet.external.dto.ExternalResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

@Slf4j
@Component
@RequiredArgsConstructor
public class AnimalApiClient {

  private static final DateTimeFormatter DATE = DateTimeFormatter.BASIC_ISO_DATE; // yyyyMMdd

  private final AnimalApiProps props;
  private final ObjectMapper om;

  private WebClient client() {
    return WebClient.builder()
        .baseUrl(props.getBaseUrl()) // 예: https://apis.data.go.kr/1543061/abandonmentPublicService_v2
        .clientConnector(new ReactorClientHttpConnector(
            HttpClient.create().responseTimeout(Duration.ofMillis(props.getTimeoutMs()))))
        .codecs(c -> c.defaultCodecs().maxInMemorySize(10 * 1024 * 1024)) // 10MB
        .build();
  }

  /**
   * region: "부산"/"Busan" 또는 upr_cd("6260000")
   * from/to: LocalDate (yyyy-MM-dd) -> API는 yyyyMMdd로 변환
   * page: 1부터 권장, 0/음수면 1로 보정
   */
  public ExternalResponse fetch(String region, LocalDate from, LocalDate to, int page, int size) {
    final String uprCd = mapToUprCd(region);
    final String bgnde = from.format(DATE);
    final String endde = to.format(DATE);
    final int pageNo = Math.max(page, 1);

    // 1) serviceKey '값만' 인코딩
    final String rawKey = props.getDecodingKey();
    final String encKey = UriUtils.encodeQueryParam(rawKey, StandardCharsets.UTF_8);

    // 2) REST 엔드포인트는 /abandonmentPublic (← _v2 아님)
    //    base-url은 루트까지만: https://apis.data.go.kr/1543061/abandonmentPublicService_v2
    final URI uri = UriComponentsBuilder
        .fromHttpUrl(props.getBaseUrl())
        .path("/abandonmentPublic")
        .queryParam("serviceKey", URLEncoder.encode(props.getDecodingKey(), StandardCharsets.UTF_8))  // 이미 인코딩된 값
        .queryParam("bgnde", bgnde)
        .queryParam("endde", endde)
        .queryParam("pageNo", pageNo)
        .queryParam("numOfRows", size)
        .queryParam("_type", "json")
        .queryParam("upr_cd", uprCd)       // null이면 무시됨
        .build(true)                       // 이미 인코딩되었음을 명시
        .toUri();

    // 3) 마스킹 로깅
    final String masked = rawKey.length() > 12 ? rawKey.substring(0, 4) + "****" + rawKey.substring(rawKey.length() - 4) : "****";
    String uriForLog = uri.toString().replace(rawKey, masked).replace(encKey, masked);
    log.info("[animal-api] GET {}", uriForLog);

    // 4) 호출 (문자열로 받아 Content-Type/본문 검증 후 DTO 파싱)
    ResponseEntity<String> res = client().get()
        .uri(uri)  // ← 미리 만든 URI 그대로 사용 (여기서 다시 builder 쓰지 않음)
        .accept(MediaType.APPLICATION_JSON)
        .retrieve()
        .onStatus(
            http -> http.isError(),
            r -> r.bodyToMono(String.class).flatMap(body -> {
              int st = r.statusCode().value();
              log.error("[api] error {} {} bgnde={} endde={} pageNo={} numOfRows={} upr_cd={} _type=json body={}",
                  st, props.getBaseUrl() + "/abandonmentPublic",
                  bgnde, endde, pageNo, size, uprCd, snippet(body));
              return Mono.error(new ApiCallException(st, body));
            })
        )
        .toEntity(String.class)
        .block();

    if (res == null) throw new RuntimeException("API returned null response");

    MediaType ct = res.getHeaders().getContentType();
    String body = res.getBody();
    int bytes = (body == null ? 0 : body.length());

    log.info("[api] OK ct={} bytes={} bgnde={} endde={} pageNo={} numOfRows={} upr_cd={}", ct, bytes, bgnde, endde, pageNo, size, uprCd);

    // 5) 방어: JSON이 아니거나 XML/HTML이면 예외
    if (ct == null || !MediaType.APPLICATION_JSON.isCompatibleWith(ct)) {
      log.error("[api] non-JSON content-type={} bodyHead={}", ct, head(body));
      throw new RuntimeException("Non-JSON response: content-type=" + ct + ", body=" + snippet(body));
    }
    if (body != null && body.stripLeading().startsWith("<")) {
      log.error("[api] XML/HTML error body detected: {}", snippet(body));
      throw new RuntimeException("API returned XML/HTML error: " + snippet(body));
    }

    // 6) JSON → DTO
    try {
      return om.readValue(body, ExternalResponse.class);
    } catch (Exception parse) {
      log.error("[api] parse error: {}", parse.toString());
      throw new RuntimeException(parse);
    }
  }

  /** "부산"/"Busan" → upr_cd, 숫자면 그대로 사용 */
  private String mapToUprCd(String region) {
    if (region == null || region.isBlank()) return null;
    String r = region.trim();
    if (r.matches("\\d+")) return r;

    switch (r.toLowerCase()) {
      case "부산":
      case "부산광역시":
      case "busan":
      case "busan-si":
      case "busan metropolitan city":
      case "busan city":
      case "busan metropolitan":
        return "6260000";
      default:
        return null;
    }
  }

  private static String snippet(String s) {
    if (s == null) return null;
    String t = s.replaceAll("\\s+", " ").trim();
    return t.length() > 500 ? t.substring(0, 500) + "...(truncated)" : t;
  }

  private static String head(String s) {
    if (s == null) return null;
    String t = s.replaceAll("\\s+", " ").trim();
    return t.length() > 80 ? t.substring(0, 80) + "..." : t;
  }

  /** 4xx/5xx 정보를 상위로 전달하기 위한 내부 예외 */
  static class ApiCallException extends RuntimeException {
    final int status;
    final String body;
    ApiCallException(int status, String body) {
      super("API " + status);
      this.status = status;
      this.body = body;
    }
  }
}
