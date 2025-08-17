package com.matchpet.external;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.matchpet.config.AnimalApiProps;
import com.matchpet.external.dto.ExternalResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Slf4j
@Component
@RequiredArgsConstructor
public class AnimalApiClient {

    private static final DateTimeFormatter BASIC = DateTimeFormatter.BASIC_ISO_DATE; // yyyyMMdd

    @Qualifier("externalRestTemplate")
    private final RestTemplate restTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AnimalApiProps props;

    public ExternalResponse call(LocalDate from, LocalDate to, String uprCd, int pageNo, int numOfRows) {
        String endpoint = props.getOperationUrl();
        String serviceKey = props.getServiceKey(); // ← 인코딩키 우선
        URI uri = UriComponentsBuilder.fromHttpUrl(endpoint)
                .queryParam("serviceKey", serviceKey)
                .queryParam("bgnde", from.format(BASIC))
                .queryParam("endde", to.format(BASIC))
                .queryParam("upr_cd", uprCd)
                .queryParam("pageNo", pageNo)
                .queryParam("numOfRows", Math.min(numOfRows, props.getPageSizeMax()))
                .queryParam("_type", "json")
                .build(true)
                .toUri();

        HttpHeaders headers = new HttpHeaders();
        headers.setAcceptCharset(java.util.List.of(StandardCharsets.UTF_8));
        headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));

        try {
            log.debug("Calling external API: {}?serviceKey=***&bgnde={}&endde={}&upr_cd={}&pageNo={}&numOfRows={}&_type=json",
                    endpoint, from.format(BASIC), to.format(BASIC), uprCd, pageNo, Math.min(numOfRows, props.getPageSizeMax()));
            ResponseEntity<ExternalResponse> resp =
                    restTemplate.exchange(uri, HttpMethod.GET, new HttpEntity<>(headers), ExternalResponse.class);
            return resp.getBody();
        } catch (RestClientResponseException e) {
            String bodyHead = e.getResponseBodyAsString();
            if (bodyHead != null && bodyHead.length() > 500) bodyHead = bodyHead.substring(0, 500);
            log.error("External API error status={}, contentType={}, bodyHead={}",
                    e.getRawStatusCode(),
                    e.getResponseHeaders() != null ? e.getResponseHeaders().getContentType() : null,
                    bodyHead);
            throw e;
        }
    }
}
