package com.matchpet.auth;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

  private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

  private final JwtTokenProvider jwt; // 토큰 파서
  private static final AntPathMatcher PM = new AntPathMatcher();

  // 공개 경로(토큰 없어도 통과)
  private static final String[] PUBLIC_PATTERNS = new String[]{
      "/actuator/**", "/error", "/uploads/**",
      "/api/auth/**",
      "/api/reco/**",
      "/api/animals/**",
      "/api/shelters/**",
      "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**"
  };

  public JwtAuthFilter(JwtTokenProvider jwt) { this.jwt = jwt; }

  private boolean isPublic(HttpServletRequest req) {
    if ("OPTIONS".equalsIgnoreCase(req.getMethod())) return true;
    String path = req.getRequestURI();
    for (String p : PUBLIC_PATTERNS) if (PM.match(p, path)) return true;
    return false;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {

    String auth = req.getHeader("Authorization");
    String token = JwtTokenProvider.resolveBearer(auth);

    try {
      if (token != null) {
        Claims claims = jwt.parse(token); // 유효하지 않으면 예외
        Long userId = Long.valueOf(claims.getSubject());
        String role = claims.get("role", String.class); // "SHELTER"/"SENIOR"/"MANAGER"/"ADMIN"

        // 권한 부여 (ROLE_ 접두어 필수)
        List<GrantedAuthority> authorities =
            (role != null && !role.isBlank())
                ? List.of(new SimpleGrantedAuthority("ROLE_" + role))
                : List.of();

        var authToken = new UsernamePasswordAuthenticationToken(userId, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(authToken);

        log.info("SECURITY AUTH: userId={}, authorities={}", userId, authorities);

      } else if (!isPublic(req)) {
        res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing token");
        return;
      }
    } catch (Exception e) {
      SecurityContextHolder.clearContext();
      if (!isPublic(req)) {
        res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token");
        return;
      }
      // 공개 경로는 통과
    }

    chain.doFilter(req, res);
  }
}
