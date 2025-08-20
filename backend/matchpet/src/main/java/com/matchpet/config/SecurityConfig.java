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
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
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
          .requestMatchers("/actuator/**").permitAll()
          .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
          .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()
          .requestMatchers("/api/auth/**").permitAll()
          .requestMatchers(HttpMethod.GET, "/api/reco/**").permitAll()
          .requestMatchers(HttpMethod.GET, "/api/animals/**").permitAll()
          .requestMatchers(HttpMethod.GET, "/api/shelters/**").permitAll()
          .requestMatchers(HttpMethod.POST, "/api/internal/ingest/**").permitAll()
          .requestMatchers("/api/applications/**").authenticated()
          .requestMatchers(HttpMethod.POST, "/api/animals/**").authenticated()
          .requestMatchers(HttpMethod.PUT,  "/api/animals/**").authenticated()
          .requestMatchers(HttpMethod.DELETE,"/api/animals/**").authenticated()
          .anyRequest().authenticated()
      )
      // ✅ 여기 추가
      .exceptionHandling(e -> e
        .authenticationEntryPoint((req, res, ex) -> res.sendError(HttpServletResponse.SC_UNAUTHORIZED))
        .accessDeniedHandler((req, res, ex) -> res.sendError(HttpServletResponse.SC_FORBIDDEN))
    )
    .addFilterBefore(jwtBlacklistFilter, UsernamePasswordAuthenticationFilter.class)
    .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

  return http.build();
}

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();

    // credentials=true를 쓰는 경우 wildcard 대신 origin "패턴" 사용 권장
    cfg.setAllowedOriginPatterns(List.of(
        "http://localhost:*",
        "http://127.0.0.1:*"
    ));
    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
    cfg.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With"));
    cfg.setExposedHeaders(List.of("Authorization", "Location"));
    cfg.setAllowCredentials(true);
    cfg.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
    src.registerCorsConfiguration("/**", cfg);
    return src;
  }
}
