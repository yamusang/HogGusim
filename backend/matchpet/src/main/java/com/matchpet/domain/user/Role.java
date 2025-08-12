// 역할 정의(SENIOR, MANAGER, SHELTER)

package com.matchpet.domain.user;

public enum Role {
    SENIOR, MANAGER, SHELTER
}

/*
 * 역할을 상수 집합으로 안전하게 관리
 * "정해진 집합"
 * enum 안에 정적 메소드 ex) from(String) 가능
 * 
 * (참고: 나중에 /signup/{role}에서 "shelter" 같은 입력을 받으려면 Role.from(String)
 *  같은 변환 메서드를 추가할 거야. 그건 컨트롤러 단계에서 같이 하자.)
 */