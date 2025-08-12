package com.matchpet.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.matchpet.domain.user.Role;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Component
public class JwtTokenProvider {
    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

    private final JwtProperties props;
    private SecretKey key;

    public JwtTokenProvider(JwtProperties props) {
        this.props = props;
    }

    @PostConstruct
    void init() {
        String secret = props.getSecret();
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("app.jwt.secret is missing or blank");
        }
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("app.jwt.secret must be >= 32 bytes, but was " + bytes.length);
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        log.debug("JWT initialized. keyLen={} bytes, expSeconds={}", bytes.length, props.getAccessExpSeconds());
    }

    public String createToken(Long userId) {
        Instant now = Instant.now();
        long expMillis = props.getAccessExpSeconds() * 1000L;
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expMillis)))
                .signWith(key, Jwts.SIG.HS256)   // jjwt 0.12.x
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)                 // jjwt 0.12.x
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String create(Long id, String email, Role role) {
      Instant now = Instant.now();
        Map<String, Object> claims = Map.of(
                "email", email,
                "role", role.name()
        );
        return Jwts.builder()
                .subject(String.valueOf(id))
                .claims(claims)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(props.getAccessExpSeconds())))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }
}
