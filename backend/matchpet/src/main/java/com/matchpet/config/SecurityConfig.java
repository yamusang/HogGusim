// src/main/java/com/matchpet/config/SecurityConfig.java
package com.matchpet.config;

import java.util.List;

import com.matchpet.auth.JwtAuthFilter;
import com.matchpet.auth.JwtBlacklistFilter;
import lombok.RequiredArgsConstructor;
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

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

  private final JwtAuthFilter jwtAuthFilter;
  private final JwtBlacklistFilter jwtBlacklistFilter;

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .cors(Customizer.withDefaults())
        .httpBasic(b -> b.disable())
        .formLogin(f -> f.disable())
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            // Actuator (디버깅 끝나면 /actuator/health만 남겨도 됨)
            .requestMatchers("/actuator/**").permitAll()

            // CORS preflight 전부 허용
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

            // ✅ 추천 API: GET만 오픈
            .requestMatchers(HttpMethod.GET, "/api/reco/**").permitAll()

            // ✅ 동물 목록: GET 전체 오픈 (/api/animals, /api/animals/{id}, /api/animals/recommended
            // ...)
            .requestMatchers(HttpMethod.GET, "/api/animals/**").permitAll()

            .requestMatchers(HttpMethod.GET, "/api/shelters/**").permitAll()

            // Swagger & OpenAPI 문서
            .requestMatchers(HttpMethod.GET, "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()

            // 인증/회원가입 등 (POST 허용)
            .requestMatchers(HttpMethod.POST, "/api/auth/**").permitAll()

            .requestMatchers("/error").permitAll() // 에러 페이지
            .requestMatchers("/favicon.ico", "/**/*.css", "/**/*.js", "/**/*.png", "/**/*.jpg").permitAll()

            // 나머지는 인증 필요
            .anyRequest().authenticated())
        // 필터 순서: 블랙리스트 → JWT 인증
        .addFilterBefore(jwtBlacklistFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(List.of(
        "http://localhost:5173",
        "http://localhost:3000"));
    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    cfg.setAllowedHeaders(List.of("*"));
    cfg.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
    src.registerCorsConfiguration("/**", cfg);
    return src;
  }
}
