package com.matchpet.auth;

import com.matchpet.domain.user.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

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

    /** 권한/이메일 포함 토큰 발급 (권장) */
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

    /** 파싱 + 서명검증 */
    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public long getExpirationEpochSeconds(String token) {
        var claims = parse(token);
        return claims.getExpiration().toInstant().getEpochSecond();
    }

    public static String resolveBearer(String authHeader) {
        if (authHeader == null) return null;
        if (!authHeader.startsWith("Bearer ")) return null;
        return authHeader.substring(7);
    }
}
