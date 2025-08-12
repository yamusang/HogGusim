// src/main/java/com/matchpet/auth/AuthService.java
package com.matchpet.auth;

import com.matchpet.auth.dto.LoginRequest;
import com.matchpet.auth.dto.LoginResponse;
import com.matchpet.auth.dto.SignupCommon;
import com.matchpet.domain.user.Role;
import com.matchpet.domain.user.User;
import com.matchpet.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepo;
  private final PasswordEncoder encoder;
  private final JwtTokenProvider jwt;

  public Long signupSenior(SignupCommon req) {
    // 최소동작: 정규화/중복체크 생략
    String hash = encoder.encode(req.getPassword()); // DTO가 record가 아닌 클래스라면 req.getPassword()
    User u = new User();
    u.setEmail(req.getEmail());                      // 클래스면 req.getEmail()
    u.setPasswordHash(hash);
    u.setRole(Role.SENIOR);
    u.setDisplayName(extractLocalPart(req.getEmail()));
    userRepo.save(u);
    return u.getId();
  }

  public LoginResponse login(LoginRequest req) {
    User u = userRepo.findByEmail(req.getEmail())
        .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "사용자를 찾을 수 없습니다."));
    if (!encoder.matches(req.getPassword(), u.getPasswordHash())) {
      throw new ResponseStatusException(BAD_REQUEST, "비밀번호가 일치하지 않습니다.");
    }
    String token = jwt.create(u.getId(), u.getEmail(), u.getRole());
    return new LoginResponse(token, u.getRole().name(), u.getId(), u.getDisplayName());
  }

  private String extractLocalPart(String email) {
    int at = email.indexOf('@');
    return at > 0 ? email.substring(0, at) : email;
  }
}
