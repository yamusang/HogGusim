package com.matchpet.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "external.animal")
public record ExternalAnimalProperties(
    String baseUrl,
    String decodingKey,
    Integer timeoutMs
) {}
