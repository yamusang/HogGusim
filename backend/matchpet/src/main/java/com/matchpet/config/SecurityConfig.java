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
<<<<<<< HEAD
            // Actuator (필요시 /actuator/health만 남겨도 됨)
            .requestMatchers("/actuator/**").permitAll()

            // CORS preflight
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

            // 정적 업로드 이미지(/uploads/**) 공개
            .requestMatchers(HttpMethod.GET, "/uploads/**").permitAll()

            // 인증/로그인 계열
            .requestMatchers("/api/auth/**").permitAll() // login/refresh 등 전체 오픈

            // 추천/동물/보호소: 조회는 공개
            .requestMatchers(HttpMethod.GET, "/api/reco/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/animals/**").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/shelters/**").permitAll()

            // Swagger & OpenAPI
            .requestMatchers(HttpMethod.GET, "/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()

            // 내부 적재(필요 시 보호) - 현재는 허용
            .requestMatchers(HttpMethod.POST, "/api/internal/ingest/**").permitAll()
            // .requestMatchers("/api/internal/ingest/**").permitAll()
            // ---- 여기서부터는 인증 필요 ----
            // applications(신청 생성/목록/승인/거절)
            .requestMatchers("/api/applications/**").authenticated()

            // animals 등록/사진 업로드 등 변경 작업
            .requestMatchers(HttpMethod.POST, "/api/animals/**").authenticated()
            .requestMatchers(HttpMethod.PUT, "/api/animals/**").authenticated()
            .requestMatchers(HttpMethod.DELETE, "/api/animals/**").authenticated()

            // 그 외 전부 인증
            .anyRequest().authenticated())
        // 필터 순서: 블랙리스트 → JWT 인증
=======
    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

    // public
    .requestMatchers(
        "/error", "/favicon.ico",
        "/api/animals/**", "/animals/**",
        "/api/reco/**", "/reco/**",
        "/api/auth/**", "/auth/**",
        "/api/shelters/**",
        "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html",
        "/actuator/**", "/uploads/**"
    ).permitAll()

    // ----- ★ 구체 경로를 일반 규칙보다 먼저 배치 ★ -----
    .requestMatchers(HttpMethod.GET, "/api/applications/by-senior/**").hasRole("SENIOR")
    .requestMatchers(HttpMethod.GET, "/api/applications/by-shelter/**").hasAnyRole("SHELTER","ADMIN")

    // 시니어 신청(생성) & 기본 목록
    .requestMatchers(HttpMethod.POST, "/api/applications").hasRole("SENIOR")
    .requestMatchers(HttpMethod.GET,  "/api/applications").authenticated()

    // 보호소 관리 동작
    .requestMatchers(HttpMethod.POST,   "/api/applications/*/approve").hasAnyRole("SHELTER","ADMIN")
    .requestMatchers(HttpMethod.POST,   "/api/applications/*/reject").hasAnyRole("SHELTER","ADMIN")

    // 나머지 applications 하위는 보호소/관리자
    .requestMatchers("/api/applications/**").hasAnyRole("SHELTER","ADMIN")

    // 내부 적재
    .requestMatchers(HttpMethod.POST, "/api/internal/ingest/**").permitAll()

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
>>>>>>> e50b54cc444e98f70c759e3045fd1759fdb1a92b
        .addFilterBefore(jwtBlacklistFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();
<<<<<<< HEAD

    // credentials=true를 쓰는 경우 wildcard 대신 origin "패턴" 사용 권장
    cfg.setAllowedOriginPatterns(List.of(
        "http://localhost:*",
        "http://127.0.0.1:*"));
    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
    cfg.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With"));
    cfg.setExposedHeaders(List.of("Authorization", "Location"));
=======
    // 개발 편의: 패턴으로 127.0.0.1 포함
    cfg.setAllowedOriginPatterns(List.of(
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ));
    cfg.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
    cfg.setAllowedHeaders(List.of(
        "Authorization","Content-Type","Accept","Origin","X-Requested-With" // ✅ 보강
    ));
    cfg.setExposedHeaders(List.of("Authorization","Location"));
>>>>>>> e50b54cc444e98f70c759e3045fd1759fdb1a92b
    cfg.setAllowCredentials(true);
    cfg.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
    src.registerCorsConfiguration("/**", cfg);
    return src;
  }
}
