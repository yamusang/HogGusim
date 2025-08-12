// src/main/java/com/matchpet/auth/AuthService.java
package com.matchpet.auth;

import com.matchpet.auth.dto.LoginRequest;
import com.matchpet.auth.dto.LoginResponse;
import com.matchpet.auth.dto.SignupCommon;
import com.matchpet.domain.user.Role;
import com.matchpet.domain.user.User;
import com.matchpet.domain.user.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CONFLICT;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
@RequiredArgsConstructor
public class AuthService {
  private final UserRepository userRepo;
  private final PasswordEncoder encoder;
  private final JwtTokenProvider jwt;

  @Transactional
  public Long signupSenior(SignupCommon req) {
    final String email = req.getEmail().trim().toLowerCase();
    if (userRepo.findByEmail(email).isPresent()) {
      throw new ResponseStatusException(CONFLICT, "이미 가입된 이메일입니다.");
    }
    if (req.getPassword() == null || req.getPassword().isBlank()) {
      throw new ResponseStatusException(BAD_REQUEST, "비밀번호가 비어있습니다.");
    }
    User u = new User();
    u.setEmail(email);
    u.setPassword(encoder.encode(req.getPassword()));
    u.setRole(Role.SENIOR);
    u.setDisplayName(extractLocalPart(email));
    userRepo.save(u);
    return u.getId();
  }

  public LoginResponse login(LoginRequest req) {
    final String email = req.getEmail().trim().toLowerCase();
    User u = userRepo.findByEmail(email)
        .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."));
    if (!encoder.matches(req.getPassword(), u.getPassword())) {
      throw new ResponseStatusException(UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.");
    }
    String token = jwt.create(u.getId(), u.getEmail(), u.getRole());
    return new LoginResponse(token, u.getRole().name(), u.getId(), u.getDisplayName());
  }

  private String extractLocalPart(String email) {
    if (email == null) return "user";
    email = email.trim();
    int at = email.indexOf('@');
    return at > 0 ? email.substring(0, at) : email;
  }

  public void logout(String authHeader) {
        // 현재는 서버 저장소에 토큰 없음 → 아무 동작 필요 없음
        // 필요시 로깅 정도만
        System.out.println("로그아웃 요청 처리: " + authHeader);
    }
}

