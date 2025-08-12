package com.matchpet.domain.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User,Long>{ // 유저 레포 인터페이스
 
    // 이메일 여부 확인
    boolean existsByEmail(String email);
    
    // 이메일 찾기
    public Optional<User> findByEmail(String email);
    
}
