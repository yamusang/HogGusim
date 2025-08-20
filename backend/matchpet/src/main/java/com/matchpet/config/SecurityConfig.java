package com.matchpet.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

  @Bean
  SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .cors(Customizer.withDefaults())
        .csrf(csrf -> csrf.disable()) // API(JWT)면 반드시 비활성
        .authorizeHttpRequests(auth -> auth
            // 프리플라이트
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

            // 공개해도 되는 엔드포인트
            .requestMatchers(
                "/error", "/favicon.ico",
                "/api/animals/**", "/animals/**",
                "/api/reco/**", "/reco/**",
                "/api/auth/**", "/auth/**", // ★ 둘 다 허용
                "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html",
                "/actuator/**")
            .permitAll()

            // 그 외는 인증 필요(임시로 모두 허용하려면 .anyRequest().permitAll() 로 바꿔도 됨)
            .anyRequest().authenticated());

    // 세션 안 쓰면 주석 해제
    // http.sessionManagement(sm ->
    // sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

    return http.build();
  }

  @Bean
  CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(List.of("http://localhost:5173"));
    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    cfg.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With"));
    cfg.setExposedHeaders(List.of("Authorization", "Location"));
    cfg.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cfg);
    return source;
  }
}
