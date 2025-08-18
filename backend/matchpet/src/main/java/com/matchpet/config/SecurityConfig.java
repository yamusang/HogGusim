package com.matchpet.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
      .csrf(csrf -> csrf.disable())
      .cors(Customizer.withDefaults())
      .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .authorizeHttpRequests(auth -> auth
          // OPTIONS 프리플라이트
          .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

          // Actuator
          .requestMatchers("/actuator/health/**", "/actuator/info").permitAll()
          .requestMatchers("/actuator/**").denyAll()

          // Swagger & 공용
          .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/error").permitAll()

          // 프론트 공개 조회
          .requestMatchers(HttpMethod.GET, "/api/animals/**").permitAll()
          .requestMatchers(HttpMethod.GET, "/api/external/**").permitAll()

          // 임시: 내부 적재도 개발 중에는 허용 (운영 전환 시 인증 필요)
          .requestMatchers("/api/internal/**").permitAll()

          // 나머지는 임시 허용
          .anyRequest().permitAll()
      );

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