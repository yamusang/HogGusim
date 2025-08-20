// src/main/java/com/matchpet/web/AnimalController.java
package com.matchpet.web;

import com.matchpet.domain.animal.dto.AnimalMapper;
import com.matchpet.domain.animal.entity.Animal;
import com.matchpet.domain.animal.repository.AnimalRepository;
import com.matchpet.web.dto.AnimalCreateRequest;
import com.matchpet.web.dto.CardDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/animals")
public class AnimalController {
  private final AnimalRepository repo;

  // 목록: careNm + status=AVAILABLE(보호중) 지원 + sort 파싱
  @GetMapping
  public Page<CardDto> list(
      @RequestParam(required = false) String careNm,
      @RequestParam(required = false) String status,  // "AVAILABLE"면 보호중만
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(required = false) String sort
  ) {
    Pageable p = parseSort(page, size, sort); // "id,DESC" 형태 지원
    boolean onlyProtected = "AVAILABLE".equalsIgnoreCase(status);
    Page<Animal> result = repo.findList(
        strOrNull(careNm), onlyProtected, p
    );
    // ⬇️ CardDto.from → AnimalMapper.toCard 로 변경
    return result.map(AnimalMapper::toCard);
  }

  // 동물 등록
  @PostMapping
  public CardDto create(@RequestBody AnimalCreateRequest req){
    Animal a = new Animal();
    a.setCareNm(req.getCareNm());
    a.setCareAddr(req.getCareAddr());
    a.setCareTel(req.getCareTel());
    a.setKindCd(req.getKindCd());
    a.setSexCd(req.getSexCd());
    a.setNeuterYn(req.getNeuterYn());
    a.setAge(req.getAge());
    a.setSpecialMark(req.getSpecialMark());
    a.setProcessState(StringUtils.hasText(req.getProcessState()) ? req.getProcessState() : "보호중");
    if (StringUtils.hasText(req.getStatus())) a.setStatus(req.getStatus()); // 내부 status 필드가 있을 경우
    a.setCreatedAt(LocalDateTime.now());
    a.setUpdatedAt(LocalDateTime.now());
    // ⬇️ CardDto.from → AnimalMapper.toCard
    return AnimalMapper.toCard(repo.save(a));
  }

  // 사진 업로드 (multipart/form-data, file 필드)
  @PostMapping("/{id}/photo")
  public CardDto upload(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws Exception {
    Animal a = repo.findById(id).orElseThrow();
    Files.createDirectories(Path.of("uploads"));
    String ext = OptionalExt.getExtension(file.getOriginalFilename());
    String key = UUID.randomUUID().toString().replace("-", "") + (ext!=null? "."+ext:"");
    Path path = Path.of("uploads", key);
    file.transferTo(path.toFile());

    String url = "/uploads/" + key;
    a.setFilename(url); // 썸네일용
    a.setPopfile(url);  // 원본 이미지 URL 겸용
    a.setUpdatedAt(LocalDateTime.now());
    repo.save(a);
    // ⬇️ CardDto.from → AnimalMapper.toCard
    return AnimalMapper.toCard(a);
  }

  // ---------------- utils ----------------
  private static String strOrNull(String s){ return (s==null || s.isBlank()) ? null : s; }

  private Pageable parseSort(int page, int size, String sort){
    if (!StringUtils.hasText(sort)) return PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
    String[] parts = sort.split(",");
    String prop = parts[0].trim();
    Sort.Direction dir = (parts.length>1 && "ASC".equalsIgnoreCase(parts[1])) ? Sort.Direction.ASC : Sort.Direction.DESC;
    return PageRequest.of(page, size, Sort.by(dir, prop));
  }

  static class OptionalExt {
    static String getExtension(String name){
      if (name==null) return null;
      int i = name.lastIndexOf('.');
      return (i>0 && i<name.length()-1) ? name.substring(i+1) : null;
    }
  }
}
