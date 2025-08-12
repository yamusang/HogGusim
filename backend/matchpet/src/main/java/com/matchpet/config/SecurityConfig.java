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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.csrf(csrf -> csrf.disable())
    .cors(Customizer.withDefaults()) // ✅ CORS 활성화
        .httpBasic(b -> b.disable())
        .formLogin(f -> f.disable())
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // ✅ 프리플라이트 허용
          .requestMatchers("/api/auth/**").permitAll()
          .anyRequest().permitAll()
        );
    return http.build();
  }
   @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration c = new CorsConfiguration();
    c.setAllowedOrigins(List.of("http://localhost:5173")); // 프론트 주소
    c.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
    c.setAllowedHeaders(List.of("Content-Type","Authorization"));
    c.setAllowCredentials(false); // 쿠키 안 쓰면 false. 쓰면 true로
    // c.setExposedHeaders(List.of("Authorization")); // 필요하면 노출 헤더
    UrlBasedCorsConfigurationSource s = new UrlBasedCorsConfigurationSource();
    s.registerCorsConfiguration("/**", c);
    return s;
  }
}
