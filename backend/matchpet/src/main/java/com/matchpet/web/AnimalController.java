package com.matchpet.web;

import com.matchpet.domain.animal.dto.AnimalMapper;
import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.animal.repository.AnimalRepository;
import com.matchpet.web.dto.AnimalCreateRequest;
import com.matchpet.web.dto.CardDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/animals")
public class AnimalController {

    private final AnimalRepository repo;

    /** 탐색/대시보드 리스트 */
    @GetMapping
    public Page<CardDto> list(
            @RequestParam(required = false) String careNm,
            @RequestParam(required = false) String status, // AVAILABLE 등 (서비스 status)
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String sort
    ) {
        Pageable pageable = PageRequest.of(page, size,
                sort != null ? Sort.by(Sort.Order.desc(sort)) : Sort.by(Sort.Order.desc("id")));

        Page<Animal> result;
        if (careNm != null && status != null) {
            result = repo.findByCareNmContainingIgnoreCaseAndStatus(
                    careNm, Animal.Status.valueOf(status), pageable);
        } else if (careNm != null) {
            result = repo.findByCareNmContainingIgnoreCase(careNm, pageable);
        } else {
            result = repo.findAll(pageable);
        }
        return result.map(AnimalMapper::toCard);
    }

    /** 단건 상세 */
    @GetMapping("/{id}")
    public CardDto getOne(@PathVariable Long id) {
        Animal a = repo.findById(id).orElseThrow();
        return AnimalMapper.toCard(a);
    }

    /** 동물 등록(보호소) – JSON 본문 */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public CardDto create(@RequestBody AnimalCreateRequest req) {
        // 프로젝트에 이미 있는 매퍼 사용 (없다면 Animal 엔티티에 직접 set 하세요)
        Animal entity = AnimalMapper.fromCreate(req);
        // 서비스 상태 기본값 보강 (필요 시)
        if (entity.getStatus() == null) entity.setStatus(Animal.Status.AVAILABLE);
        if (entity.getCreatedAt() == null) entity.setCreatedAt(LocalDateTime.now());
        Animal saved = repo.save(entity);
        return AnimalMapper.toCard(saved);
    }

    /** 사진 업로드 (등록 후 이미지 교체) */
    @PostMapping(path = "/{id}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CardDto uploadPhoto(@PathVariable Long id,
                               @RequestParam("file") MultipartFile file) throws Exception {
        Animal a = repo.findById(id).orElseThrow();

        if (file.isEmpty()) {
            return AnimalMapper.toCard(a); // 아무 것도 없으면 그냥 현재 상태 반환
        }

        // 업로드 디렉토리 (프로젝트 루트 하위 /uploads)
        Path uploadDir = Path.of(System.getProperty("user.dir"), "uploads");
        Files.createDirectories(uploadDir);

        String original = StringUtils.cleanPath(file.getOriginalFilename());
        String ext = "";
        int dot = original.lastIndexOf('.');
        if (dot > -1) ext = original.substring(dot).toLowerCase();

        // 간단한 확장자 허용
        Set<String> allowed = Set.of(".jpg", ".jpeg", ".png", ".gif", ".webp");
        if (!allowed.contains(ext)) {
            throw new IllegalArgumentException("이미지 파일만 업로드 가능합니다(jpg/jpeg/png/gif/webp).");
        }

        String newName = UUID.randomUUID().toString().replace("-", "") + ext;
        Path target = uploadDir.resolve(newName);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        // 엔티티 갱신 (정적 제공 경로는 /uploads/** 가 SecurityConfig에서 permitAll 되어 있어야 함)
        a.setFilename(newName);
        a.setPopfile("/uploads/" + newName);
        Animal saved = repo.save(a);

        return AnimalMapper.toCard(saved);
    }

    /** 상태 변경(보호소) – AVAILABLE/MATCHING/CONNECTED/RETURNED */
    @PatchMapping("/{id}/status")
    public CardDto updateStatus(@PathVariable Long id,
                                @RequestParam("status") String status) {
        Animal a = repo.findById(id).orElseThrow();
        a.setStatus(Animal.Status.valueOf(status));
        Animal saved = repo.save(a);
        return AnimalMapper.toCard(saved);
    }
}
