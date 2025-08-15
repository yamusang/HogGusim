package com.matchpet.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;

@Getter
@Setter
@Component
@Slf4j
@ConfigurationProperties(prefix = "external.animal")
public class AnimalApiProps {
  private String baseUrl;
  private String decodingKey;
  private int timeoutMs = 5000;
  // ✅ 추가: 포털 '일반 인증키(Encoding)'
  private String encodingKey;
  

  public String getBaseUrl() {
    return baseUrl;
  }

  public void setBaseUrl(String baseUrl) {
    this.baseUrl = baseUrl;
  }

  public String getDecodingKey() {
    return decodingKey;
  }

  public void setDecodingKey(String decodingKey) {
    this.decodingKey = decodingKey;
  }

  public int getTimeoutMs() {
    return timeoutMs;
  }

  public void setTimeoutMs(int timeoutMs) {
    this.timeoutMs = timeoutMs;
  }

  @PostConstruct
  void check() {
    if (decodingKey == null || decodingKey.contains("{")) {
      throw new IllegalStateException(
          "ANIMAL_DECODING_KEY 환경변수가 주입되지 않았습니다. OS 환경변수 설정 및 VSCode 터미널 재시작을 확인하세요.");
    }
    log.info("Animal API props OK: baseUrl={}, key(head)={}",
        baseUrl, decodingKey.substring(0, Math.min(6, decodingKey.length())) + "...");
  }
}