package com.matchpet.config;

import com.matchpet.auth.JwtAuthFilter;
import com.matchpet.auth.JwtBlacklistFilter;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

  private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

  private final JwtAuthFilter jwtAuthFilter;
  private final JwtBlacklistFilter jwtBlacklistFilter;

  @Bean
  SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .cors(c -> c.configurationSource(corsConfigurationSource()))
        .csrf(csrf -> csrf.disable())
        .httpBasic(b -> b.disable())
        .formLogin(f -> f.disable())
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            // 프리플라이트
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

            // 공개 엔드포인트
            .requestMatchers(
                "/error", "/favicon.ico",
                "/api/animals/**", "/animals/**",
                "/api/reco/**", "/reco/**",
                "/api/auth/**", "/auth/**",
                "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html",
                "/actuator/**", "/uploads/**"
            ).permitAll()

            // 보호소 신청 현황(읽기/승인/거절 등) : SHELTER/ADMIN
            .requestMatchers(HttpMethod.GET, "/api/applications/**").hasAnyRole("SHELTER","ADMIN")
            .requestMatchers(HttpMethod.POST, "/api/applications/**").hasAnyRole("SHELTER","ADMIN")
            .requestMatchers(HttpMethod.PATCH, "/api/applications/**").hasAnyRole("SHELTER","ADMIN")
            .requestMatchers(HttpMethod.PUT, "/api/applications/**").hasAnyRole("SHELTER","ADMIN")
            .requestMatchers(HttpMethod.DELETE, "/api/applications/**").hasAnyRole("SHELTER","ADMIN")

            // 그 외는 인증 필요
            .anyRequest().authenticated()
        )
        .exceptionHandling(ex -> ex
            .accessDeniedHandler((req, res, ex2) -> {
              var a = SecurityContextHolder.getContext().getAuthentication();
              log.warn("ACCESS DENIED path={} principal={} authorities={}",
                  req.getRequestURI(), a==null?null:a.getPrincipal(), a==null?null:a.getAuthorities());
              res.sendError(HttpServletResponse.SC_FORBIDDEN, "Forbidden");
            })
            .authenticationEntryPoint((req, res, ex3) -> {
              log.warn("UNAUTHORIZED path={} msg={}", req.getRequestURI(), ex3.getMessage());
              res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
            })
        )
        .addFilterBefore(jwtBlacklistFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  @Bean
  CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(List.of("http://localhost:5173")); // 프론트 실제 포트
    cfg.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
    cfg.setAllowedHeaders(List.of("Authorization","Content-Type","Accept","Origin"));
    cfg.setExposedHeaders(List.of("Authorization","Location"));
    cfg.setAllowCredentials(true);
    cfg.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cfg);
    return source;
  }
}
