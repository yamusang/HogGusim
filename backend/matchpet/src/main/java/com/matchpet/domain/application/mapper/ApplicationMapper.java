package com.matchpet.domain.application.mapper;

import com.matchpet.web.dto.ApplicationRow;
import com.matchpet.domain.application.entity.Application;
import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.senior.entity.Senior;
import com.matchpet.domain.manager.entity.ManagerProfile;

public class ApplicationMapper {
    public static ApplicationRow row(Application a) {
        Animal animal  = a.getAnimal();   // ✅ 연관 엔티티
        Senior senior  = a.getSenior();
        ManagerProfile manager = a.getManager();

        return ApplicationRow.builder()
                .id(a.getId())
                .status(a.getStatus().name())
                .createdAt(a.getCreatedAt())

                .animalId(a.getAnimalId())   // 원시 id 그대로
                .animalName(animal != null ? animal.getKindCd() : null) // kindCd 또는 breed 필드

                .seniorId(a.getSeniorId())
                .seniorName(senior != null ? senior.getName() : null)

                .managerId(a.getManagerId())
                .managerName(manager != null ? manager.getName() : null)
                .managerPhone(manager != null ? manager.getPhoneNumber() : null)
                .build();
    }
}
