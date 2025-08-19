package com.matchpet.auth;

import com.matchpet.auth.dto.LoginRequest;
import com.matchpet.auth.dto.LoginResponse;
import com.matchpet.auth.dto.SignupCommon;
import com.matchpet.domain.user.Role;
import com.matchpet.domain.user.User;
import com.matchpet.domain.user.UserRepository;

import lombok.Builder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

// ⬇︎ 추가
import com.matchpet.domain.animal.repository.AnimalRepository;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtTokenProvider jwtTokenProvider;
  private final TokenBlacklistService tokenBlacklistService;

  // ⬇︎ 추가: 보호소명 검증을 위해 주입
  private final AnimalRepository animalRepository;

  // 이메일 중복 체크
  private void checkEmailDup(String email) {
    if (userRepository.findByEmail(email).isPresent()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 가입된 이메일입니다.");
    }
  }

  // displayName 서버에서 생성/보정
  private String resolveDisplayName(SignupCommon req) {
    String dn = req.getDisplayName();
    if (dn == null || dn.isBlank()) {
      String email = req.getEmail();
      dn = email.contains("@") ? email.substring(0, email.indexOf('@')) : email;
    } else {
      dn = dn.trim();
    }
    return dn.length() > 80 ? dn.substring(0, 80) : dn;
  }

  // ⚠️ affiliation 자동 보정 (프론트가 안 줄 때 기본값) — MANAGER만 사용
  private String coalesceAffiliation(Role role, String affiliation) {
    if (role == Role.MANAGER) {
      if (!StringUtils.hasText(affiliation)) {
        return "미지정";
      }
      return affiliation.trim();
    }
    // SENIOR/SHELTER는 여기서 기본값을 만들지 않음 (SHELTER는 별도 검증)
    return null;
  }

  // 기본: SENIOR 가입
  public Long signupSenior(SignupCommon req) {
    log.info("[signupSenior] email={}, role={}, affiliation='{}'",
        req.getEmail(), req.getRole(), req.getAffiliation());
    checkEmailDup(req.getEmail());

    User u = new User();
    u.setEmail(req.getEmail());
    u.setPassword(passwordEncoder.encode(req.getPassword()));
    u.setDisplayName(resolveDisplayName(req));
    u.setRole(Role.SENIOR);
    u.setAffiliation(null);

    return userRepository.save(u).getId();
  }

  // MANAGER 가입
  public Long signupManager(SignupCommon req) {
    log.info("[signupManager] email={}, role={}, affiliation='{}'",
        req.getEmail(), req.getRole(), req.getAffiliation());
    checkEmailDup(req.getEmail());

    User u = new User();
    u.setEmail(req.getEmail());
    u.setPassword(passwordEncoder.encode(req.getPassword()));
    u.setDisplayName(resolveDisplayName(req));
    u.setRole(Role.MANAGER);
    u.setAffiliation(coalesceAffiliation(Role.MANAGER, req.getAffiliation()));

    return userRepository.save(u).getId();
  }

  // SHELTER 가입 — ✅ 보호소명 존재 검증 추가
  public Long signupShelter(SignupCommon req) {
    log.info("[signupShelter] email={}, role={}, affiliation='{}'",
        req.getEmail(), req.getRole(), req.getAffiliation());
    checkEmailDup(req.getEmail());

    // ⬇︎ 핵심: affiliation 필수 + DB 존재 여부 체크
    validateShelterAffiliationOr400(req);

    String normalizedAff = normalizeAffiliation(req.getAffiliation());

    User u = new User();
    u.setEmail(req.getEmail());
    u.setPassword(passwordEncoder.encode(req.getPassword()));
    u.setDisplayName(resolveDisplayName(req));
    u.setRole(Role.SHELTER);
    u.setAffiliation(normalizedAff); // 정규화된 보호소명 저장

    return userRepository.save(u).getId();
  }

  // 로그인
  
  public LoginResponse login(LoginRequest req) {
  User u = userRepository.findByEmail(req.getEmail())
      .orElseThrow(() -> new ResponseStatusException(
          HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."));

  if (!passwordEncoder.matches(req.getPassword(), u.getPassword())) {
    throw new ResponseStatusException(
        HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.");
  }

  u.setLastLoginAt(java.time.LocalDateTime.now());
  userRepository.save(u);

 String token = jwtTokenProvider.createToken(u.getId());

  // ★ 프론트가 쓰는 필드로 맞춰서 응답
  return LoginResponse.builder()
        .token(token)
        .role(u.getRole().name())
        .email(u.getEmail())              // ★
        .userId(u.getId())                // (옵션)
        .displayName(u.getDisplayName())
        .affiliation(u.getAffiliation())  // ★
        .build();
}

  public void logout(String authHeader) {
    String token = JwtTokenProvider.resolveBearer(authHeader);
    if (token != null) {
      long exp = jwtTokenProvider.getExpirationEpochSeconds(token);
      tokenBlacklistService.add(token, exp);
    }
  }

  // ============== 아래는 유틸/검증 ==============

  /** SHELTER 가입 시 affiliation(보호소명) 검증: 필수 + DB 존재 여부 확인 */
  private void validateShelterAffiliationOr400(SignupCommon req) {
    if (req.getRole() != Role.SHELTER) return;

    String aff = normalizeAffiliation(req.getAffiliation());
    if (!StringUtils.hasText(aff)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "affiliation(보호소명)은 필수입니다.");
    }
    boolean ok = animalRepository.existsByCareNmStrict(aff);
    if (!ok) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "등록되지 않은 보호소명입니다: " + aff);
    }
  }

  /** 비교/저장 일관성을 위한 간단 정규화(앞뒤 공백 제거 + 내부 연속 공백 1칸) */
  private static String normalizeAffiliation(String s) {
    if (s == null) return "";
    String t = s.trim();
    t = t.replaceAll("\\s+", " ");
    return t;
  }
}
// aa