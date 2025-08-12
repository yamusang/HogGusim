// src/main/java/com/matchpet/auth/JwtTokenProvider.java
package com.matchpet.auth;

import com.matchpet.domain.user.Role;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Component
public class JwtTokenProvider {
  private final SecretKey key;
  private final long expSeconds;

  public JwtTokenProvider(
      @Value("${app.jwt.secret}") String secret,
      @Value("${app.jwt.access-exp-seconds}") long expSeconds
  ) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.expSeconds = expSeconds;
  }

  public String create(Long userId, String email, Role role) {
    Instant now = Instant.now();
    return Jwts.builder()
        .subject(email)
        .claims(Map.of("uid", userId, "role", role.name()))
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plusSeconds(expSeconds)))
        .signWith(key)
        .compact();
  }
}
