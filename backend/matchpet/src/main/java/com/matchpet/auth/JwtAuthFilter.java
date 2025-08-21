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

  private final JwtTokenProvider jwt;
  private static final AntPathMatcher PM = new AntPathMatcher();

  // 퍼블릭 경로 (필터 자체를 스킵)
  private static final String[] PUBLIC_PATTERNS = new String[]{
      "/actuator/**", "/error", "/uploads/**",
      "/api/internal/ingest/**",
      "/api/auth/**",
      "/api/reco/**",
      "/api/animals/**",
      "/api/shelters/**",                // ✅ 퍼블릭
      "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**"
  };

  public JwtAuthFilter(JwtTokenProvider jwt) { this.jwt = jwt; }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true; // CORS 프리플라이트 스킵
    String path = request.getRequestURI();
    for (String p : PUBLIC_PATTERNS) {
      if (PM.match(p, path)) return true; // 퍼블릭은 아예 필터 스킵
    }
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

        List<GrantedAuthority> authorities =
            (role != null && !role.isBlank())
                ? List.of(new SimpleGrantedAuthority("ROLE_" + role))
                : List.of();

        var authToken = new UsernamePasswordAuthenticationToken(userId, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(authToken);

        log.debug("SECURITY AUTH: userId={}, authorities={}", userId, authorities);
      }
      // 토큰 없으면 그냥 통과 → 아래 Security 규칙이 처리(보호된 경로면 401)
      chain.doFilter(req, res);

    } catch (Exception e) {
      SecurityContextHolder.clearContext();
      // 토큰이 있었는데 잘못된 경우에만 401 반환 (퍼블릭은 shouldNotFilter 로 이미 스킵됨)
      res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token");
    }
  }
}
