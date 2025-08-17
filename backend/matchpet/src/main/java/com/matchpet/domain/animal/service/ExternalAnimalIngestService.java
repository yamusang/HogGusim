package com.matchpet.domain.animal.service;

import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.animal.repository.AnimalRepository;
import com.matchpet.external.AnimalApiClient;
import com.matchpet.external.dto.ExternalResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExternalAnimalIngestService {

    private static final DateTimeFormatter BASIC = DateTimeFormatter.BASIC_ISO_DATE; // yyyyMMdd

    private final AnimalApiClient api;
    private final AnimalRepository animalRepo;

    @Transactional
    public IngestCounters ingest(LocalDate from, LocalDate to, String uprCd, int pageSize) {
        int page = 1;
        int inserted = 0;
        int updated = 0;
        int total = 0;

        while (true) {
            ExternalResponse res = api.call(from, to, uprCd, page, pageSize);
            if (res == null || res.getResponse() == null || res.getResponse().getBody() == null) break;
            ExternalResponse.Body body = res.getResponse().getBody();
            List<ExternalResponse.Item> items = body.getItems() != null ? body.getItems().getItem() : null;
            if (items == null || items.isEmpty()) break;

            for (ExternalResponse.Item it : items) {
                boolean isInsert = upsert(it);
                if (isInsert) inserted++; else updated++;
            }
            total += items.size();

            int pageNo = body.getPageNo() != null ? body.getPageNo() : page;
            int numOfRows = body.getNumOfRows() != null ? body.getNumOfRows() : pageSize;
            int totalCount = body.getTotalCount() != null ? body.getTotalCount() : total;
            if (pageNo * numOfRows >= totalCount) break;
            page++;
        }
        log.info("Ingest done. total={}, inserted={}, updated={}", total, inserted, updated);
        return new IngestCounters(total, inserted, updated);
    }

    private boolean upsert(ExternalResponse.Item it) {
        Optional<Animal> existing = animalRepo.findByDesertionNo(it.getDesertionNo());
        if (existing.isPresent()) {
            Animal a = existing.get();
            apply(a, it);
            // dirty checking으로 update
            return false;
        } else {
            Animal a = new Animal();
            // 외부 식별자(필수)와 유니크 키 모두 설정
            a.setExternalId(it.getDesertionNo());
            a.setDesertionNo(it.getDesertionNo());
            apply(a, it);
            animalRepo.save(a);
            return true;
        }
    }

    private void apply(Animal a, ExternalResponse.Item it) {
        // external_id는 항상 desertionNo와 동일하게 유지
        if (a.getExternalId() == null || a.getExternalId().isBlank()) {
            a.setExternalId(it.getDesertionNo());
        }
        a.setHappenDt(parseYmd(it.getHappenDt()));
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
    }

    public static LocalDate parseYmd(String ymd) {
        if (ymd == null || ymd.isBlank()) return null;
        return LocalDate.parse(ymd, BASIC);
    }

    /** yyyy-MM-dd 또는 yyyyMMdd 둘 다 허용 */
    public static LocalDate parseDateFlexible(String input) {
        if (input == null) return null;
        String s = input.trim();
        if (s.length() == 8 && s.chars().allMatch(Character::isDigit)) {
            return LocalDate.parse(s, BASIC);
        }
        return LocalDate.parse(s);
    }

    @Getter @AllArgsConstructor
    public static class IngestCounters {
        private final int total;
        private final int inserted;
        private final int updated;
    }
}
