package com.matchpet.domain.senior;

import org.springframework.stereotype.Service;

import com.matchpet.domain.senior.entity.Senior;
import com.matchpet.domain.senior.repository.SeniorRepository;
import com.matchpet.domain.user.User;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service @RequiredArgsConstructor
public class SeniorService {
  private final SeniorRepository seniorRepository;

  @Transactional
  public Senior createForUser(User user, String phone, String addr, String emergency) {
    Senior s = new Senior();
    s.setUserId(user.getId());
    s.setName(user.getDisplayName
    () != null ? user.getDisplayName() : user.getEmail());
    s.setPhoneNumber(phone);
    s.setAddress(addr);
    s.setEmergencyContact(emergency);
    return seniorRepository.save(s);
  }
}