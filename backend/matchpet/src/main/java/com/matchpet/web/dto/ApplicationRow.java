// src/main/java/com/matchpet/web/dto/ApplicationRow.java
package com.matchpet.web.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class ApplicationRow {
    private Long id;
    private String status;          // PENDING / APPROVED / REJECTED / CANCELED
    private LocalDateTime createdAt;

    private Long animalId;
    private String animalName;

    private Long seniorId;
    private String seniorName;

    private Long managerId;
    private String managerName;
}
