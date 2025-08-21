package com.matchpet.auth;

import com.matchpet.auth.dto.LoginRequest;
import com.matchpet.auth.dto.LoginResponse;
import com.matchpet.auth.dto.SignupCommon;
import com.matchpet.auth.dto.SeniorMinimalDto;
import com.matchpet.auth.dto.SeniorMinimalUpsert;
import com.matchpet.auth.mapper.SeniorMinimalMapper;
import com.matchpet.domain.senior.entity.SeniorProfile;
import com.matchpet.domain.senior.repository.SeniorProfileRepository;
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

    // ★ 추가
    private final SeniorProfileRepository seniorProfileRepository;

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
    @Transactional
    public LoginResponse login(LoginRequest req) {
        return login(req.getEmail(), req.getPassword(), req.getSeniorProfile());
    }

    /** 내부 공용: email/password(+선택 senior upsert) → LoginResponse */
    @Transactional
    public LoginResponse login(String email, String rawPassword) {
        // 기존 시그니처 호환(외부에서 직접 호출하는 경우를 위해 오버로드 유지)
        return login(email, rawPassword, null);
    }

    /** 내부 공용 오버로드: senior 최소 업서트까지 한 번에 */
    @Transactional
    public LoginResponse login(String email, String rawPassword, SeniorMinimalUpsert seniorUpsert) {
        User u = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("user not found"));

        if (!passwordEncoder.matches(rawPassword, u.getPassword())) {
            throw new IllegalArgumentException("bad credentials");
        }

        String token = jwtTokenProvider.create(u.getId(), u.getEmail(), u.getRole());
        long exp = jwtTokenProvider.getExpirationEpochSeconds(token);

        SeniorMinimalDto seniorDto = null;
        boolean profileComplete = true; // 기본값(시니어가 아니면 true)

        if (u.getRole() == Role.SENIOR) {
            profileComplete = false; // 시니어는 기본 false에서 검증
            SeniorProfile profile = seniorProfileRepository.findById(u.getId()).orElse(null);

            if (seniorUpsert != null) {
                boolean hasAddress = seniorUpsert.getAddress() != null && !seniorUpsert.getAddress().isBlank();

                if (profile == null && hasAddress) {
                    // 주소가 있을 때만 최초 INSERT (address NOT NULL 준수)
                    profile = new SeniorProfile();
                    profile.setUserId(u.getId());
                    SeniorMinimalMapper.patchEntity(profile, seniorUpsert);
                    profile = seniorProfileRepository.save(profile);
                } else if (profile != null) {
                    // 기존 행 있으면 3필드만 부분 UPDATE
                    SeniorMinimalMapper.patchEntity(profile, seniorUpsert);
                    profile = seniorProfileRepository.save(profile);
                }
                // (profile == null && 주소 없음) → 생성 스킵
            }

            // 최신 프로필 로드 후 완성도 판단
            if (profile == null) {
                profile = seniorProfileRepository.findById(u.getId()).orElse(null);
            }
            seniorDto = SeniorMinimalMapper.toDto(profile);
            profileComplete = isMinimalComplete(profile);
        }

        return LoginResponse.builder()
            .token(token)
            .expiresAt(exp)
            .userId(u.getId())
            .email(u.getEmail())
            .role(u.getRole().name())
            // ↓ 추가 응답
            .seniorProfile(seniorDto)
            .profileComplete(profileComplete)
            .build();
    }

    public void logout(String authHeader) {
        String token = JwtTokenProvider.resolveBearer(authHeader);
        if (token == null) return;
        // 블랙리스트 사용 시 여기에 추가
        log.info("logout (no-op) tokenHash={}", token.hashCode());
    }

    /** 기존 토큰을 검증하고 같은 클레임으로 재발급 → LoginResponse */
    @Transactional
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

        // 시니어면 최신 프로필 동봉(업서트는 아님)
        SeniorMinimalDto seniorDto = null;
        boolean profileComplete = true;
        if (role == Role.SENIOR) {
            SeniorProfile profile = seniorProfileRepository.findById(userId).orElse(null);
            seniorDto = SeniorMinimalMapper.toDto(profile);
            profileComplete = isMinimalComplete(profile);
        }

        return LoginResponse.builder()
            .token(newToken)
            .expiresAt(exp)
            .userId(userId)
            .email(email)
            .role(role.name())
            // ↓ 추가 응답
            .seniorProfile(seniorDto)
            .profileComplete(profileComplete)
            .build();
    }

    /** 주소/전화/비상연락망 3개 모두 채워져 있으면 true */
    private boolean isMinimalComplete(SeniorProfile p) {
        if (p == null) return false;
        boolean hasAddress   = p.getAddress() != null && !p.getAddress().isBlank();
        boolean hasPhone     = p.getPhoneNumber() != null && !p.getPhoneNumber().isBlank();
        boolean hasEmergency = p.getEmergencyContact() != null && !p.getEmergencyContact().isBlank();
        return hasAddress && hasPhone && hasEmergency;
    }
}
