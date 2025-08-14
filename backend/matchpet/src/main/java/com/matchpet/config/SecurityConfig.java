// src/main/java/com/matchpet/config/SecurityConfig.java
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
      .csrf(csrf -> csrf.disable())
      .cors(Customizer.withDefaults())
      .httpBasic(b -> b.disable())
      .formLogin(f -> f.disable())
      .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .authorizeHttpRequests(auth -> auth
        // OPTIONS 프리플라이트
        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
        // Swagger & 공용
        .requestMatchers("/swagger-ui/**","/v3/api-docs/**","/error").permitAll()
        // 개발 중 공개 API (원하면 나중에 잠그기)
        .requestMatchers(HttpMethod.GET,  "/api/animals/**").permitAll()
        .requestMatchers(HttpMethod.POST, "/admin/ingest/**").permitAll()
        .requestMatchers("/api/auth/**").permitAll()
        // 그 외는 인증 필요
        .anyRequest().authenticated()
      );

    // ── JWT 필터를 사용하는 경우에만 주석 해제 ─────────────────────────────
    http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
    http.addFilterBefore(jwtBlacklistFilter, JwtAuthFilter.class);
    // ─────────────────────────────────────────────────────────────────────

    return http.build();
  }

   @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();
    // 개발 편의: 모든 오리진 허용. 운영에서는 도메인 명시 권장.
    cfg.setAllowedOriginPatterns(List.of("*"));
    cfg.setAllowedMethods(List.of("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
    cfg.setAllowedHeaders(List.of("*"));
    cfg.setExposedHeaders(List.of("Authorization", "Content-Disposition"));
    cfg.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cfg);
    return source;
  }
}
