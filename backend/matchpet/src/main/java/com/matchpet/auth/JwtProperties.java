package com.matchpet.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {
    private String secret;           // 최소 32바이트
    private long accessExpSeconds = 86400; // 초 단위

    public String getSecret() { return secret; }
    public void setSecret(String secret) { this.secret = secret; }
    public long getAccessExpSeconds() { return accessExpSeconds; }
    public void setAccessExpSeconds(long accessExpSeconds) { this.accessExpSeconds = accessExpSeconds; }
}
