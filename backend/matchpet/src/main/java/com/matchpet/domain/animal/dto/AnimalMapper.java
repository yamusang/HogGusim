package com.matchpet.domain.animal.dto;

import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.web.dto.CardDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;

/** Entity → DTO 매핑 유틸 */
public final class AnimalMapper {

    private AnimalMapper() {}

    private static final DateTimeFormatter D = DateTimeFormatter.ISO_LOCAL_DATE;

    private static String d(LocalDate v) {
        return v == null ? null : D.format(v);
    }

    /** 개별 매핑 (CardDto 기준) */
    public static CardDto toCard(Animal a) {
        if (a == null) return null;

        return CardDto.builder()
            .desertionNo(a.getDesertionNo())
            .happenDt(d(a.getHappenDt()))        // LocalDate → String
            // 필요 시 공고 시작/종료일 등도 String으로 변환
            // .noticeSdt(d(a.getNoticeSdt()))
            // .noticeEdt(d(a.getNoticeEdt()))
            .kind(a.getKindCd())
            .color(a.getColorCd())
            .sex(a.getSexCd())
            .neuter(a.getNeuterYn())
            .processState(a.getProcessState())
            .thumbnail(a.getFilename())
            .image(a.getPopfile())
            .careName(a.getCareNm())
            .careTel(a.getCareTel())
            .careAddr(a.getCareAddr())
            .specialMark(a.getSpecialMark())
            .build();
    }

    /** 리스트 매핑 */
    public static List<CardDto> toCardList(List<Animal> list) {
        return list == null ? List.of() : list.stream().filter(Objects::nonNull).map(AnimalMapper::toCard).toList();
    }

    /** 페이지 매핑 */
    public static Page<CardDto> toCardPage(Page<Animal> page, Pageable pageable) {
        List<CardDto> content = toCardList(page.getContent());
        return new PageImpl<>(content, pageable, page.getTotalElements());
    }
}
