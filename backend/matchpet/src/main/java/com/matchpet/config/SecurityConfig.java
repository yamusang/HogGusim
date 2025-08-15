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
        // 개발 편의: CSRF 전체 비활성 (운영 전환 시 선택적으로 재활성 고려)
        .csrf(csrf -> csrf.disable())
        .cors(Customizer.withDefaults())
        .httpBasic(b -> b.disable())
        .formLogin(f -> f.disable())
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            // OPTIONS 프리플라이트
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

            // Actuator
            .requestMatchers("/actuator/health/**", "/actuator/info").permitAll()
            .requestMatchers("/actuator/**").denyAll()

            // Swagger & 공용
            .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/error").permitAll()

            // 프론트 조회 공개
            .requestMatchers(HttpMethod.GET, "/api/animals/**").permitAll()

            // ✅ 인제스트(수집) 공개
            .requestMatchers(HttpMethod.POST, "/internal/ingest/**").permitAll()
            .requestMatchers(HttpMethod.POST, "/admin/ingest/**").permitAll()

            // 로그인/회원가입 등 공개
            .requestMatchers("/api/auth/**").permitAll()

            // 외부 프록시 조회 공개
            .requestMatchers(HttpMethod.GET, "/api/external/animals/**").permitAll()

            // 나머지는 인증 필요
            .anyRequest().authenticated());

    // JWT 필터 체인
    http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
    http.addFilterBefore(jwtBlacklistFilter, JwtAuthFilter.class);

    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();
    // 개발 중 전체 허용 (운영에선 허용 도메인 명시 권장)
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
