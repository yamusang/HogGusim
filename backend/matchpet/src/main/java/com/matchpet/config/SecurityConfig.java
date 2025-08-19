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

  // ★ @Component 로 등록된 필터를 생성자 주입
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
          .requestMatchers(HttpMethod.GET, "/api/animals", "/api/animals/**").permitAll()
          .requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()
          .requestMatchers(HttpMethod.POST, "/api/auth/**").permitAll()   // 로그인/회원가입/리프레시 허용
          .anyRequest().authenticated()
      )
      // ★ 순서 중요: 블랙리스트 → 인증
      .addFilterBefore(jwtBlacklistFilter, UsernamePasswordAuthenticationFilter.class)
      .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:3000"));
    cfg.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
    cfg.setAllowedHeaders(List.of("*"));
    cfg.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
    src.registerCorsConfiguration("/**", cfg);
    return src;
  }
}
