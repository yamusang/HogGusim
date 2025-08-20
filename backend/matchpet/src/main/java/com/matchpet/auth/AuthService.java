package com.matchpet.auth;

import com.matchpet.auth.dto.LoginRequest;
import com.matchpet.auth.dto.LoginResponse;
import com.matchpet.auth.dto.SignupCommon;
import com.matchpet.domain.user.Role;
import com.matchpet.domain.user.User;
import com.matchpet.domain.user.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public Long signupManager(SignupCommon req) { return signupCommon(req, Role.MANAGER); }

    @Transactional
    public Long signupShelter(SignupCommon req) { return signupCommon(req, Role.SHELTER); }

    @Transactional
    public Long signupSenior(SignupCommon req) { return signupCommon(req, Role.SENIOR); }

    private Long signupCommon(SignupCommon req, Role role) {
        userRepository.findByEmail(req.getEmail()).ifPresent(u -> {
            throw new IllegalArgumentException("email already exists: " + req.getEmail());
        });

        User u = new User();
        u.setEmail(req.getEmail());
        u.setPassword(passwordEncoder.encode(req.getPassword()));
        String name = Optional.ofNullable(req.getDisplayName()).filter(s -> !s.isBlank()).orElse("user");
        // 엔티티가 displayName을 쓰는 경우
        try { u.getClass().getMethod("setDisplayName", String.class).invoke(u, name); }
        catch (Exception ignore) { /* setName만 있는 경우 대비 */ 
            try { u.getClass().getMethod("setName", String.class).invoke(u, name); } catch (Exception ignored) {}
        }
        u.setRole(role);
        // 필요시: affiliation 필드가 엔티티에 있으면 세팅

        userRepository.save(u);
        return u.getId();
    }

    /** 컨트롤러가 기대하는 시그니처: DTO → LoginResponse */
    public LoginResponse login(LoginRequest req) {
        return login(req.getEmail(), req.getPassword());
    }

    /** 내부 공용: email/password → LoginResponse */
    public LoginResponse login(String email, String rawPassword) {
        User u = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("user not found"));

        if (!passwordEncoder.matches(rawPassword, u.getPassword())) {
            throw new IllegalArgumentException("bad credentials");
        }

        String token = jwtTokenProvider.create(u.getId(), u.getEmail(), u.getRole());
        long exp = jwtTokenProvider.getExpirationEpochSeconds(token);

        return LoginResponse.builder()
            .token(token)
            .expiresAt(exp)
            .userId(u.getId())
            .email(u.getEmail())
            .role(u.getRole().name())
            .build();
    }

    public void logout(String authHeader) {
        String token = JwtTokenProvider.resolveBearer(authHeader);
        if (token == null) return;
        // 블랙리스트 사용 시 여기에 추가
        log.info("logout (no-op) tokenHash={}", token.hashCode());
    }

    /** 기존 토큰을 검증하고 같은 클레임으로 재발급 → LoginResponse */
    public LoginResponse refresh(String authHeader) {
        String token = JwtTokenProvider.resolveBearer(authHeader);
        if (token == null) throw new IllegalArgumentException("missing bearer");

        var claims = jwtTokenProvider.parse(token);
        Long userId = Long.valueOf(claims.getSubject());
        String email = claims.get("email", String.class);
        String roleStr = claims.get("role", String.class);
        Role role = Role.valueOf(roleStr);

        String newToken = jwtTokenProvider.create(userId, email, role);
        long exp = jwtTokenProvider.getExpirationEpochSeconds(newToken);

        return LoginResponse.builder()
            .token(newToken)
            .expiresAt(exp)
            .userId(userId)
            .email(email)
            .role(role.name())
            .build();
    }
}
