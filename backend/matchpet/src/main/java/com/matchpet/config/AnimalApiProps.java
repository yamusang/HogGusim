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
 * - base-url 과 endpoint 를 각각 받거나,
 * - 전체 operation URL 을 base-url 에 바로 넣는 것도 허용
 * - serviceKey는 encodingKey(인코딩) 우선, 없으면 decodingKey(평문) 사용
 */
@Getter
@Setter
@Slf4j
@Component
@ConfigurationProperties(prefix = "animal.api")
public class AnimalApiProps {

    /** 루트 또는 오퍼레이션까지 포함된 URL */
    private String baseUrl = "https://apis.data.go.kr/1543061/abandonmentPublicService_v2";

    /** 오퍼레이션(기본 abandonmentPublic_v2). baseUrl이 루트로 끝날 때만 붙임 */
    private String endpoint = "abandonmentPublic_v2";

    /** URL-인코딩된 서비스키 (예: ...%2B...%3D%3D). 있으면 이 값을 우선 사용 */
    private String encodingKey;

    /** URL-디코딩된 평문 서비스키 (예: ...+...==). encodingKey가 없을 때만 사용 */
    private String decodingKey;

    /** 타임아웃(ms) */
    private int timeoutMs = 10000;

    /** 최대 페이지 크기 */
    private int pageSizeMax = 1000;

    @PostConstruct
    public void init() {
        // 환경변수 보강
        if (!StringUtils.hasText(encodingKey)) {
            String envEnc = System.getenv("ANIMAL_ENCODING_KEY");
            if (StringUtils.hasText(envEnc)) encodingKey = envEnc;
        }
        if (!StringUtils.hasText(decodingKey)) {
            String envDec = System.getenv("ANIMAL_DECODING_KEY");
            if (StringUtils.hasText(envDec)) decodingKey = envDec;
        }
        // 둘 다 없으면 실패
        if (!StringUtils.hasText(encodingKey) && !StringUtils.hasText(decodingKey)) {
            throw new IllegalStateException("animal.api.encoding-key 또는 animal.api.decoding-key(또는 환경변수)가 필요합니다.");
        }
        log.info("AnimalApiProps loaded. baseUrl={}, endpoint={}, useKey={}, timeoutMs={}, pageSizeMax={}",
                baseUrl, endpoint,
                StringUtils.hasText(encodingKey) ? "encodingKey" : "decodingKey",
                timeoutMs, pageSizeMax);
    }

    /** 항상 올바른 오퍼레이션 URL 반환 */
    public String getOperationUrl() {
        if (!StringUtils.hasText(baseUrl)) return null;
        String trimmed = baseUrl.trim();
        String op = normalize(endpoint);

        // 이미 operation 까지 포함된 경우
        if (trimmed.endsWith("/" + op)) return trimmed;

        // 루트로 끝나면 endpoint 덧붙임
        if (trimmed.endsWith("/abandonmentPublicService_v2")) {
            return trimmed.endsWith("/") ? trimmed + op : trimmed + "/" + op;
        }
        // 루트 정확 매칭
        if (trimmed.equals("https://apis.data.go.kr/1543061/abandonmentPublicService_v2")) {
            return trimmed + "/" + op;
        }
        // 그 외는 그대로 사용(사용자가 전체 URL 지정)
        return trimmed;
    }

    /** serviceKey를 반환: encodingKey 우선, 없으면 decodingKey */
    public String getServiceKey() {
        if (StringUtils.hasText(encodingKey)) return encodingKey;
        return decodingKey;
    }

    public int getTimeoutMs() {
        return timeoutMs;
    }

    public int getPageSizeMax() {
        return pageSizeMax;
    }

    private static String normalize(String s) {
        if (!StringUtils.hasText(s)) return "abandonmentPublic_v2";
        String t = s.trim();
        if (t.startsWith("/")) t = t.substring(1);
        return t;
    }
}
