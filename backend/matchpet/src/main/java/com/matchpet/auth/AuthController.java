// src/main/java/com/matchpet/auth/AuthController.java
package com.matchpet.auth;

import com.matchpet.auth.dto.IdResponse;
import com.matchpet.auth.dto.LoginRequest;
import com.matchpet.auth.dto.LoginResponse;
import com.matchpet.auth.dto.SignupCommon;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;

  @PostMapping("/signup")
  @ResponseStatus(HttpStatus.OK) // 200으로 통일(원하면 201로 바꿔도 됨)
  public IdResponse signupSenior(@RequestBody SignupCommon req) {
    Long id = authService.signupSenior(req);
    return new IdResponse(id);
  }

  @PostMapping("/login")
  public LoginResponse login(@RequestBody LoginRequest req) {
    return authService.login(req);
  }
}