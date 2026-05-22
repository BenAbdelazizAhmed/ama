package com.example.amanafarm_backend.controller;

import com.example.amanafarm_backend.dto.AnimalRequest;
import com.example.amanafarm_backend.dto.AnimalResponse;
import com.example.amanafarm_backend.service.AnimalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/animals")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"})
public class AnimalController {

    private final AnimalService animalService;

    @PostMapping
    public AnimalResponse createAnimal(@RequestBody AnimalRequest request) {
        return animalService.createAnimal(request);
    }

    @GetMapping
    public List<AnimalResponse> getAllAnimals() {
        return animalService.getAllAnimals();
    }

    @GetMapping("/{id}")
    public AnimalResponse getAnimalById(@PathVariable Long id) {
        return animalService.getAnimalById(id);
    }

    @PutMapping("/{id}")
    public AnimalResponse updateAnimal(@PathVariable Long id, @RequestBody AnimalRequest request) {
        return animalService.updateAnimal(id, request);
    }

    @DeleteMapping("/{id}")
    public String deleteAnimal(@PathVariable Long id) {
        animalService.deleteAnimal(id);
        return "Animal deleted successfully";
    }

    /**
     * Upload images for an existing animal.
     * Angular calls: POST /api/animals/{id}/images  (multipart/form-data, field = "files")
     */
    @PostMapping("/{id}/images")
    public ResponseEntity<Map<String, List<String>>> uploadImages(
            @PathVariable Long id,
            @RequestParam("files") List<MultipartFile> files) {

        List<String> urls = animalService.uploadImages(id, files);
        return ResponseEntity.ok(Map.of("imageUrls", urls));
    }
}