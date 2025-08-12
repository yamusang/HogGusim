// src/main/java/com/matchpet/auth/TokenBlacklistService.java
package com.matchpet.auth;

import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TokenBlacklistService {
  private final Map<String, Long> blacklist = new ConcurrentHashMap<>(); // token -> exp

  public void add(String token, long expEpochSeconds) {
    blacklist.put(token, expEpochSeconds);
  }
  public boolean isBlacklisted(String token) {
    Long exp = blacklist.get(token);
    if (exp == null) return false;
    if (Instant.now().getEpochSecond() >= exp) { // 만료 지난건 청소
      blacklist.remove(token);
      return false;
    }
    return true;
  }
}
