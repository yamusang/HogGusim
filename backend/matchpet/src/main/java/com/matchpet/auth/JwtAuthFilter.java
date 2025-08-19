// src/main/java/com/matchpet/auth/JwtAuthFilter.java
package com.matchpet.auth;

import com.matchpet.domain.user.User;
import com.matchpet.domain.user.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        // Authorization 헤더에서 Bearer 토큰만 추출 (없으면 null)
        String token = JwtTokenProvider.resolveBearer(request.getHeader("Authorization"));

        // 이미 인증된 상태가 아니고, 토큰이 있을 때만 검증 시도
        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                // 1) 토큰 파싱/검증(서명, 만료)
                Claims claims = jwtTokenProvider.parse(token);
                Long userId = Long.parseLong(claims.getSubject());

                // 2) 유저 조회(필요시 역할 부여)
                User user = userRepository.findById(userId).orElse(null);
                if (user != null) {
                    var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
                    var auth = new UsernamePasswordAuthenticationToken(userId, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                } else {
                    // 사용자 없으면 인증 미설정 (permitAll 경로는 계속 통과됨)
                    SecurityContextHolder.clearContext();
                }
            } catch (Exception ex) {
                // 토큰 문제(만료/위조 등): 인증 미설정하고 그냥 통과
                SecurityContextHolder.clearContext();
            }
        }

        // 그 외는 그대로 진행
        chain.doFilter(request, response);
    }
}
