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
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

  private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

  private final JwtTokenProvider jwt;
  private static final AntPathMatcher PM = new AntPathMatcher();

  // 퍼블릭 경로 (필터 자체를 스킵)
  private static final String[] PUBLIC_PATTERNS = new String[] {
      "/actuator/**", "/error", "/uploads/**",
      "/api/internal/ingest/**",
      "/api/auth/**",
      "/api/reco/**",
      "/api/animals/**",
      "/api/shelters/**", // ✅ 퍼블릭
      "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**"
  };

  public JwtAuthFilter(JwtTokenProvider jwt) {
    this.jwt = jwt;
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    if ("OPTIONS".equalsIgnoreCase(request.getMethod()))
      return true; // CORS 프리플라이트
    String path = request.getRequestURI();
    for (String p : PUBLIC_PATTERNS)
      if (PM.match(p, path))
        return true;
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

        // role | roles | authorities 모두 지원
        Object rawRole = claims.get("role"); // "SENIOR"
        Object rawRoles = claims.get("roles"); // ["SENIOR", ...]
        Object rawAuths = claims.get("authorities"); // ["SENIOR", "ROLE_ADMIN", ...]

        List<String> roleStrings = new ArrayList<>();
        if (rawRole instanceof String r && !r.isBlank())
          roleStrings.add(r.trim());
        if (rawRoles instanceof Collection<?> c1)
          for (Object o : c1)
            if (o != null)
              roleStrings.add(o.toString().trim());
        if (rawAuths instanceof Collection<?> c2)
          for (Object o : c2)
            if (o != null)
              roleStrings.add(o.toString().trim());

        List<GrantedAuthority> authorities = roleStrings.stream()
            .filter(s -> !s.isEmpty())
            .map(s -> s.startsWith("ROLE_") ? s : "ROLE_" + s) // ✅ 접두사 보장
            .distinct()
            .map(SimpleGrantedAuthority::new)
            .collect(Collectors.toList()); // ✅ JDK 8/11

        var authToken = new UsernamePasswordAuthenticationToken(userId, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(authToken);

        if (log.isDebugEnabled())
          log.debug("SECURITY AUTH: userId={}, authorities={}", userId, authorities);
      }

      chain.doFilter(req, res);

    } catch (Exception e) {
      SecurityContextHolder.clearContext();
      res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token");
    }
  }
}
