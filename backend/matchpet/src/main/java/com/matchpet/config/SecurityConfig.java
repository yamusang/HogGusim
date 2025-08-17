package com.matchpet.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.matchpet.auth.JwtAuthFilter;
import com.matchpet.auth.JwtBlacklistFilter;

import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

  private final JwtBlacklistFilter jwtBlacklistFilter;
  private final JwtAuthFilter jwtAuthFilter;

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        // 개발 편의: CSRF 비활성 (운영 전 재검토)
        .csrf(csrf -> csrf.disable())
        .cors(Customizer.withDefaults())
        .httpBasic(b -> b.disable())
        .formLogin(f -> f.disable())
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            // OPTIONS 프리플라이트
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

            // Actuator (헬스/인포만 허용, 나머지 차단)
            .requestMatchers("/actuator/health/**", "/actuator/info").permitAll()
            .requestMatchers("/actuator/**").denyAll()

            // Swagger & 공용
            .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/error").permitAll()

            // 프론트 조회 공개
            .requestMatchers(HttpMethod.GET, "/api/animals/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/external/animals/**").permitAll()

            // ✅ 인제스트(수집) 공개 - 둘 다 허용 (/api/internal/... 과 /internal/...)
            .requestMatchers(HttpMethod.POST, "/api/internal/ingest/**").permitAll()
            .requestMatchers(HttpMethod.POST, "/internal/ingest/**").permitAll()
            .requestMatchers(HttpMethod.POST, "/admin/ingest/**").permitAll()

            // 로그인/회원가입 등 공개
            .requestMatchers("/api/auth/**").permitAll()

            // 그 외는 인증 필요
            .anyRequest().authenticated()
        );

    // JWT 필터 체인
    // 주의: 공개 엔드포인트에서 토큰이 없을 때도 통과하도록 JwtAuthFilter가 "헤더 없으면 계속 진행" 방식이어야 함
    http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
    http.addFilterBefore(jwtBlacklistFilter, JwtAuthFilter.class);

    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();
    // 개발 중 전체 허용 (운영에서는 허용 도메인만 명시 권장)
    cfg.setAllowedOriginPatterns(List.of("*"));
    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
    cfg.setAllowedHeaders(List.of("*"));
    cfg.setExposedHeaders(List.of("Authorization", "Content-Disposition"));
    cfg.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cfg);
    return source;
  }
}
