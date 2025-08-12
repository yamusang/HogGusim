package com.matchpet.auth;

import com.matchpet.auth.dto.LoginRequest;
import com.matchpet.auth.dto.LoginResponse;
import com.matchpet.auth.dto.SignupCommon;
import com.matchpet.domain.user.Role;
import com.matchpet.domain.user.User;
import com.matchpet.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtTokenProvider jwtTokenProvider;
  private final TokenBlacklistService tokenBlacklistService;

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

  // ⚠️ affiliation 자동 보정 (프론트가 안 줄 때 기본값)
  private String coalesceAffiliation(Role role, String affiliation) {
    if (role == Role.MANAGER || role == Role.SHELTER) {
      if (affiliation == null || affiliation.isBlank()) {
        return "미지정"; // 기본값
      }
      return affiliation.trim();
    }
    return null; // SENIOR는 null
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

  // SHELTER 가입
  public Long signupShelter(SignupCommon req) {
    log.info("[signupShelter] email={}, role={}, affiliation='{}'",
        req.getEmail(), req.getRole(), req.getAffiliation());
    checkEmailDup(req.getEmail());

    User u = new User();
    u.setEmail(req.getEmail());
    u.setPassword(passwordEncoder.encode(req.getPassword()));
    u.setDisplayName(resolveDisplayName(req));
    u.setRole(Role.SHELTER);
    u.setAffiliation(coalesceAffiliation(Role.SHELTER, req.getAffiliation()));

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

    return new LoginResponse(
        token,
        u.getRole().name(),
        u.getId(),
        u.getDisplayName());
  }

  public void logout(String authHeader) {
  String token = JwtTokenProvider.resolveBearer(authHeader);
  if (token != null) {
    long exp = jwtTokenProvider.getExpirationEpochSeconds(token);
    tokenBlacklistService.add(token, exp);
  }
}
}
