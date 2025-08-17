// src/main/java/com/matchpet/domain/stats/entity/RescueStat.java
package com.matchpet.domain.stats.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity @Getter @Setter @NoArgsConstructor
@Table(name = "rescue_stats", indexes = {
        @Index(name = "idx_rescue_stats_ymd", columnList = "stat_ymd"),
        @Index(name = "idx_rescue_stats_codes", columnList = "upr_cd,org_cd,care_reg_no")
})
public class RescueStat {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 8)
    private String statYmd;

    @Column(length = 10)
    private String uprCd;

    @Column(length = 10)
    private String orgCd;

    @Column(length = 20)
    private String careRegNo;

    @Column(length = 80)
    private String category;

    private Integer cnt;

    @Column(length = 64, nullable = false, unique = true)
    private String itemHash;

    @Lob
    @Column(columnDefinition = "json", nullable = false)
    private String payload;
}
