// src/main/java/com/matchpet/external/RescueStatsApiClient.java
package com.matchpet.external;

import com.matchpet.external.dto.RescueStatsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class RescueStatsApiClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${animal.api.base-rescue-stats:https://apis.data.go.kr/1543061/rescueAnimalStatsService}")
    private String baseUrl;

    @Value("${animal.api.service-key}") // 디코딩된 serviceKey 환경변수 사용
    private String serviceKey;

    public RescueStatsResponse fetch(
            String bgnde, String endde,
            String uprCd, String orgCd, String careRegNo,
            int pageNo, int numOfRows, String type // "json" 권장
    ) {
        WebClient wc = webClientBuilder
                .baseUrl(baseUrl)
                .build();

        return wc.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/rescueAnimalStats")
                        .queryParam("serviceKey", serviceKey)
                        .queryParam("bgnde", bgnde)
                        .queryParam("endde", endde)
                        .queryParamIfPresent("upr_cd", uprCd == null || uprCd.isBlank() ? java.util.Optional.empty() : java.util.Optional.of(uprCd))
                        .queryParamIfPresent("org_cd", orgCd == null || orgCd.isBlank() ? java.util.Optional.empty() : java.util.Optional.of(orgCd))
                        .queryParamIfPresent("care_reg_no", careRegNo == null || careRegNo.isBlank() ? java.util.Optional.empty() : java.util.Optional.of(careRegNo))
                        .queryParam("pageNo", pageNo)
                        .queryParam("numOfRows", numOfRows)
                        .queryParam("_type", type == null ? "json" : type)
                        .build())
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .bodyToMono(RescueStatsResponse.class)
                .onErrorResume(e -> Mono.error(new IllegalStateException("RescueStats API 호출 실패: " + e.getMessage(), e)))
                .block();
    }
}
