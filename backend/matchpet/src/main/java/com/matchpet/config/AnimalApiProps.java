package com.matchpet.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 공공데이터포털 유기동물 API 설정
 * - baseUrl + endpoint 조합 또는 endpoint 전체 URL 직접 지정
 * - serviceKey는 encodingKey(인코딩키) 우선, 없으면 decodingKey(평문) 사용
 */
@Slf4j
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "animal.api")
public class AnimalApiProps {

    /** 예: https://apis.data.go.kr/1543061 */
    private String baseUrl = "https://apis.data.go.kr/1543061";

    /** 예: /abandonmentPublicService_v2/abandonmentPublic_v2 (선행 '/' 허용) 또는 전체 URL */
    private String endpoint = "/abandonmentPublicService_v2/abandonmentPublic_v2";

    /** 인코딩된 서비스키 (권장) */
    private String encodingKey;

    /** 평문 서비스키 (백업용) */
    private String decodingKey;

    /** 연결 타임아웃(ms) */
    private int timeoutMs = 5000;

    /** 최대 페이지 크기 */
    private int pageSizeMax = 1000;

    /** 내부적으로 사용할 최종 호출 URL */
    private String resolvedEndpoint;

    /** 최종 사용할 서비스키 */
    private String serviceKey;

    @PostConstruct
    public void fix() {
        // endpoint 전체 URL이면 그대로 사용, 아니면 baseUrl과 합치기
        String ep = normalize(endpoint);
        if (ep.startsWith("http://") || ep.startsWith("https://")) {
            resolvedEndpoint = ep;
        } else {
            String b = (baseUrl != null) ? baseUrl.trim() : "";
            if (b.endsWith("/")) b = b.substring(0, b.length() - 1);
            if (!ep.startsWith("/")) ep = "/" + ep;
            resolvedEndpoint = b + ep;
        }

        // 서비스키 결정 (인코딩키 우선)
        serviceKey = StringUtils.hasText(encodingKey) ? encodingKey : decodingKey;

        // 어떤 키를 선택했는지 로그 남기기
        boolean hasEnc = StringUtils.hasText(encodingKey);
        boolean hasDec = StringUtils.hasText(decodingKey);
        String picked = hasEnc ? "encodingKey" : (hasDec ? "decodingKey" : "NONE");

        log.info("AnimalApiProps initialized: endpoint={}, pageSizeMax={}, timeoutMs={}, keyPicked={}",
                resolvedEndpoint, pageSizeMax, timeoutMs, picked);

        // 키 없으면 부팅 단계에서 강제 종료 → 빨리 문제 알 수 있게
        if (!StringUtils.hasText(serviceKey)) {
            throw new IllegalStateException(
                    "서비스키가 없습니다. ANIMAL_ENCODING_KEY 또는 ANIMAL_DECODING_KEY 환경변수를 설정하세요.");
        }

        // 혹시 따옴표 포함된 상태로 들어온 경우 제거
        if (serviceKey.startsWith("\"") && serviceKey.endsWith("\"")) {
            serviceKey = serviceKey.substring(1, serviceKey.length() - 1);
        }
    }

    private static String normalize(String s) {
        return (s == null) ? "" : s.trim();
    }
}
