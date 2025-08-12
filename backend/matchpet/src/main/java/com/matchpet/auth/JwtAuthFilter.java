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

        String token = JwtTokenProvider.resolveBearer(request.getHeader("Authorization"));

        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                // 유효성/서명/만료 검증
                Claims claims = jwtTokenProvider.parse(token);
                Long userId = Long.parseLong(claims.getSubject());

                // DB 조회로 권한/유저 확인 (토큰에 role 넣었다면 이 부분 생략 가능)
                User user = userRepository.findById(userId).orElse(null);
                if (user != null) {
                    var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
                    var auth = new UsernamePasswordAuthenticationToken(userId, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception e) {
                // 토큰 문제(만료/위조 등) → 인증 미설정
                SecurityContextHolder.clearContext();
            }
        }

        chain.doFilter(request, response);
    }
}
