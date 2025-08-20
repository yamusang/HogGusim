// src/main/java/com/matchpet/auth/JwtBlacklistFilter.java
package com.matchpet.auth;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.util.AntPathMatcher;

import java.io.IOException;

@Component
public class JwtBlacklistFilter extends OncePerRequestFilter {

  private final TokenBlacklistService blacklist;
  private static final AntPathMatcher PM = new AntPathMatcher();
  private static final String[] PUBLIC_PATTERNS = new String[]{
      "/actuator/**", "/error", "/uploads/**",
      "/api/auth/**", "/api/reco/**", "/api/animals/**", "/api/shelters/**",
      "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**"
  };

  public JwtBlacklistFilter(TokenBlacklistService blacklist) { this.blacklist = blacklist; }

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

    if (token != null && blacklist.isBlacklisted(token)) {
      // 공개 경로면 차단하지 않고 통과 (토큰만 무시)
      if (isPublic(req)) {
        chain.doFilter(req, res);
        return;
      }
      res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token revoked");
      return;
    }
    chain.doFilter(req, res);
  }
}
