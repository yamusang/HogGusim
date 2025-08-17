package com.matchpet.config;

import java.time.Duration;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(RescueStatsApiProps.class)
public class RescueConfig {

    @Bean
    public RestClient rescueRestClient(RescueStatsApiProps props) {
        var factory = new JdkClientHttpRequestFactory();
        if (props.connectTimeout() != null) {
            factory.setConnectTimeout(Duration.ofMillis(props.connectTimeout()));
        }
        if (props.readTimeout() != null) {
            factory.setReadTimeout(Duration.ofMillis(props.readTimeout()));
        }
        return RestClient.builder()
                .baseUrl(props.baseUrl())
                .requestFactory(factory)
                .build();
    }
}
