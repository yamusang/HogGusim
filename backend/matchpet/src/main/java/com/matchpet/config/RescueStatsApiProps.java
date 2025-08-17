package com.matchpet.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "rescue.api")
public record RescueStatsApiProps(
    String baseUrl,
    String path,
    String serviceKey,
    Integer connectTimeout,
    Integer readTimeout
) {}