package com.matchpet.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Configuration
public class HttpClientConfig {

    private final AnimalApiProps props;

    public HttpClientConfig(AnimalApiProps props) {
        this.props = props;
    }

    /**
     * 외부 공공데이터 API 전용 RestTemplate
     * - 기존 다른 곳에서 쓰는 기본 restTemplate 빈과 이름이 겹치지 않도록 별도 이름을 사용한다.
     */
    @Bean(name = "externalRestTemplate")
    public RestTemplate externalRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(props.getTimeoutMs()));
        factory.setReadTimeout(Duration.ofMillis(props.getTimeoutMs()));
        return new RestTemplate(factory);
    }
}
