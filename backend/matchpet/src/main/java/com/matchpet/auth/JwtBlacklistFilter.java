// src/main/java/com/matchpet/auth/JwtBlacklistFilter.java
package com.matchpet.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtBlacklistFilter extends OncePerRequestFilter {

    private final TokenBlacklistService tokenBlacklistService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        // Authorization 헤더에서 Bearer 토큰만 추출 (없으면 null)
        String token = JwtTokenProvider.resolveBearer(request.getHeader("Authorization"));

        // 토큰이 있고, 블랙리스트면 즉시 차단 (모든 경로 공통)
        if (token != null && tokenBlacklistService.isBlacklisted(token)) {
            SecurityContextHolder.clearContext();
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401
            // 필요 시 헤더 추가: response.setHeader("WWW-Authenticate", "Bearer error=\"invalid_token\"");
            return;
        }

        // 토큰 없거나 블랙리스트가 아니면 통과
        chain.doFilter(request, response);
    }
}
