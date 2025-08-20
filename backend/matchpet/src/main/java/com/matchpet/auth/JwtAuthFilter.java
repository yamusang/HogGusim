// src/main/java/com/matchpet/auth/JwtAuthFilter.java
package com.matchpet.auth;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

  private final JwtTokenProvider jwt;           // parse() 에 사용할 인스턴스
  private static final AntPathMatcher PM = new AntPathMatcher();

  // 공개 경로(토큰 없거나 잘못돼도 통과)
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
    // ✅ static 메서드라 클래스명으로 호출
    String token = JwtTokenProvider.resolveBearer(auth);

    try {
      Long userId = null;
      if (token != null) {
        // ✅ validate 대신 parse로 검증 + subject → userId 추출
        Claims claims = jwt.parse(token);               // 유효하지 않으면 예외 발생
        userId = Long.valueOf(claims.getSubject());
      }

      if (userId != null) {
        var authToken = new UsernamePasswordAuthenticationToken(
            userId, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(authToken);
      } else {
        // 토큰 없거나 파싱 실패: 공개 경로면 통과
        if (isPublic(req)) {
          chain.doFilter(req, res);
          return;
        }
        // 보호 경로는 SecurityConfig의 exceptionHandling에서 401/403 처리
      }
    } catch (Exception e) {
      SecurityContextHolder.clearContext();
      if (!isPublic(req)) {
        res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token");
        return;
      }
      // 공개 경로면 그냥 통과
    }

    chain.doFilter(req, res);
  }
}
