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
      .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
      .requestMatchers("/api/auth/**").permitAll()
      .anyRequest().authenticated() // ✅ 이제 보호
    )
    // ✅ 순서 보장: Blacklist → Auth
    .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
    .addFilterBefore(jwtBlacklistFilter, JwtAuthFilter.class); // ← 이 줄이 핵심
  return http.build();
}

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration c = new CorsConfiguration();
    c.setAllowedOrigins(List.of("http://localhost:5173"));
    c.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
    c.setAllowedHeaders(List.of("Content-Type","Authorization"));
    c.setAllowCredentials(false);
    UrlBasedCorsConfigurationSource s = new UrlBasedCorsConfigurationSource();
    s.registerCorsConfiguration("/**", c);
    return s;
  }
}
