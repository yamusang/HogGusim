package com.matchpet.auth.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class SeniorMinimalUpsert {
    private String address;
    private String phoneNumber;
    private String emergencyContact;
}
