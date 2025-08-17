package com.matchpet.service;

import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.animal.repository.AnimalRepository;
import com.matchpet.external.dto.ExternalResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnimalIngestService {

    private final AnimalRepository animalRepo;
    private static final DateTimeFormatter BASIC = DateTimeFormatter.BASIC_ISO_DATE; // yyyyMMdd

    /** yyyyMMdd -> LocalDate */
    private LocalDate toLocalDate(String yyyymmdd) {
        if (yyyymmdd == null || yyyymmdd.isBlank()) return null;
        return LocalDate.parse(yyyymmdd.trim(), BASIC);
    }

    /** 외부 아이템 1건 upsert */
    @Transactional
    public Animal upsertFromExternal(ExternalResponse.Item it) {
        String desertionNo = it.getDesertionNo();
        if (desertionNo == null || desertionNo.isBlank()) {
            throw new IllegalArgumentException("desertionNo is required");
        }

        Animal a = animalRepo.findByDesertionNo(desertionNo).orElseGet(() -> {
            Animal na = new Animal();
            na.setDesertionNo(desertionNo);
            return na;
        });

        // 매핑
        a.setHappenDt(toLocalDate(it.getHappenDt()));
        a.setHappenPlace(it.getHappenPlace());
        a.setKindCd(it.getKindCd());
        a.setColorCd(it.getColorCd());
        a.setAge(it.getAge());
        a.setWeight(it.getWeight());
        a.setSexCd(it.getSexCd());
        a.setNeuterYn(it.getNeuterYn());
        a.setSpecialMark(it.getSpecialMark());
        a.setCareNm(it.getCareNm());
        a.setCareTel(it.getCareTel());
        a.setCareAddr(it.getCareAddr());
        a.setProcessState(it.getProcessState());
        a.setFilename(it.getFilename());
        a.setPopfile(it.getPopfile());

        return animalRepo.save(a);
    }

    /** 외부 아이템 여러 건 일괄 upsert */
    @Transactional
    public int upsertAll(List<ExternalResponse.Item> items) {
        if (items == null || items.isEmpty()) return 0;
        int cnt = 0;
        for (ExternalResponse.Item it : items) {
            upsertFromExternal(it);
            cnt++;
        }
        log.info("[ingest] batch upsert count={}", cnt);
        return cnt;
    }
}
