package com.example.amanafarm_backend.service;

import com.example.amanafarm_backend.dto.AnimalRequest;
import com.example.amanafarm_backend.dto.AnimalResponse;
import com.example.amanafarm_backend.model.Animal;
import com.example.amanafarm_backend.model.AnimalImage;
import com.example.amanafarm_backend.repository.AnimalImageRepository;
import com.example.amanafarm_backend.repository.AnimalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnimalService {

    private final AnimalRepository animalRepository;
    private final AnimalImageRepository animalImageRepository;

    // Configurable via application.properties:
    //   app.upload.dir=./uploads
    //   app.base-url=http://localhost:8082
    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Value("${app.base-url:http://localhost:8081}")
    private String baseUrl;

    // ──────────────────────────────────────────────
    // CREATE
    // ──────────────────────────────────────────────
    public AnimalResponse createAnimal(AnimalRequest request) {
        Animal animal = Animal.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory())
                .price(request.getPrice())
                .priceType(request.getPriceType())
                .wilaya(request.getWilaya())
                .zone(request.getZone())
                .age(request.getAge())
                .gender(request.getGender())
                .healthStatus(request.getHealthStatus())
                .phone(request.getPhone())
                .contactMethod(request.getContactMethod())
                .deliveryAvailable(Boolean.TRUE.equals(request.getDeliveryAvailable()))
                .vetCertificate(Boolean.TRUE.equals(request.getVetCertificate()))
                .featured(Boolean.TRUE.equals(request.getFeatured()))
                .trustedSeller(Boolean.TRUE.equals(request.getTrustedSeller()))
                .status("ACTIVE")
                .userId(request.getUserId())
                .build();

        // Images passées en URL directement (ex: Unsplash, CDN)
        if (request.getImages() != null) {
            for (int i = 0; i < request.getImages().size(); i++) {
                AnimalImage image = AnimalImage.builder()
                        .imageUrl(request.getImages().get(i))
                        .isMain(i == 0)
                        .animal(animal)
                        .build();
                animal.getImages().add(image);
            }
        }

        return mapToResponse(animalRepository.save(animal));
    }

    // ──────────────────────────────────────────────
    // READ ALL
    // ──────────────────────────────────────────────
    public List<AnimalResponse> getAllAnimals() {
        return animalRepository.findByStatusOrderByCreatedAtDesc("ACTIVE")
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // ──────────────────────────────────────────────
    // READ ONE
    // ──────────────────────────────────────────────
    public AnimalResponse getAnimalById(Long id) {
        Animal animal = animalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Animal not found: " + id));
        return mapToResponse(animal);
    }

    // ──────────────────────────────────────────────
    // UPDATE
    // ──────────────────────────────────────────────
    public AnimalResponse updateAnimal(Long id, AnimalRequest request) {
        Animal animal = animalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Animal not found: " + id));

        animal.setTitle(request.getTitle());
        animal.setDescription(request.getDescription());
        animal.setCategory(request.getCategory());
        animal.setPrice(request.getPrice());
        animal.setPriceType(request.getPriceType());
        animal.setWilaya(request.getWilaya());
        animal.setZone(request.getZone());
        animal.setAge(request.getAge());
        animal.setGender(request.getGender());
        animal.setHealthStatus(request.getHealthStatus());
        animal.setPhone(request.getPhone());
        animal.setContactMethod(request.getContactMethod());
        animal.setDeliveryAvailable(Boolean.TRUE.equals(request.getDeliveryAvailable()));
        animal.setVetCertificate(Boolean.TRUE.equals(request.getVetCertificate()));
        animal.setFeatured(Boolean.TRUE.equals(request.getFeatured()));
        animal.setTrustedSeller(Boolean.TRUE.equals(request.getTrustedSeller()));

        if (request.getImages() != null && !request.getImages().isEmpty()) {
            animal.getImages().clear();
            for (int i = 0; i < request.getImages().size(); i++) {
                AnimalImage image = AnimalImage.builder()
                        .imageUrl(request.getImages().get(i))
                        .isMain(i == 0)
                        .animal(animal)
                        .build();
                animal.getImages().add(image);
            }
        }

        return mapToResponse(animalRepository.save(animal));
    }

    // ──────────────────────────────────────────────
    // DELETE (soft)
    // ──────────────────────────────────────────────
    public void deleteAnimal(Long id) {
        Animal animal = animalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Animal not found: " + id));
        animal.setStatus("DELETED");
        animalRepository.save(animal);
    }

    // ──────────────────────────────────────────────
    // UPLOAD IMAGES (multipart depuis Angular)
    // POST /api/animals/{id}/images
    // ──────────────────────────────────────────────
    public List<String> uploadImages(Long animalId, List<MultipartFile> files) {
        Animal animal = animalRepository.findById(animalId)
                .orElseThrow(() -> new RuntimeException("Animal not found: " + animalId));

        // Créer le dossier uploads s'il n'existe pas
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath();
        try {
            Files.createDirectories(uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("Impossible de créer le dossier uploads: " + e.getMessage());
        }

        List<String> savedUrls = new ArrayList<>();
        boolean isFirst = animal.getImages().isEmpty();

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;

            // Validation type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new RuntimeException("Type de fichier non supporté: " + contentType);
            }

            // Validation taille (max 5MB)
            if (file.getSize() > 5 * 1024 * 1024) {
                throw new RuntimeException("Fichier trop volumineux (max 5MB): " + file.getOriginalFilename());
            }

            try {
                // Nom unique pour éviter les conflits
                String extension = getExtension(file.getOriginalFilename());
                String filename = UUID.randomUUID().toString() + "." + extension;
                Path filePath = uploadPath.resolve(filename);

                // Sauvegarder le fichier physiquement
                file.transferTo(filePath.toFile());

                // URL publique accessible depuis le navigateur
                String imageUrl = baseUrl + "/uploads/" + filename;

                // Persister en base
                AnimalImage image = AnimalImage.builder()
                        .imageUrl(imageUrl)
                        .isMain(isFirst)   // première image uploadée = principale
                        .animal(animal)
                        .build();

                animalImageRepository.save(image);
                animal.getImages().add(image);
                savedUrls.add(imageUrl);

                isFirst = false; // les suivantes ne sont pas principales

            } catch (IOException e) {
                throw new RuntimeException("Erreur lors de l'upload: " + file.getOriginalFilename(), e);
            }
        }

        animalRepository.save(animal);
        return savedUrls;
    }

    // ──────────────────────────────────────────────
    // MAPPER
    // ──────────────────────────────────────────────
    private AnimalResponse mapToResponse(Animal animal) {
        return AnimalResponse.builder()
                .id(animal.getId())
                .title(animal.getTitle())
                .description(animal.getDescription())
                .category(animal.getCategory())
                .price(animal.getPrice())
                .priceType(animal.getPriceType())
                .wilaya(animal.getWilaya())
                .zone(animal.getZone())
                .age(animal.getAge())
                .gender(animal.getGender())
                .healthStatus(animal.getHealthStatus())
                .phone(animal.getPhone())
                .contactMethod(animal.getContactMethod())
                .deliveryAvailable(animal.getDeliveryAvailable())
                .vetCertificate(animal.getVetCertificate())
                .featured(animal.getFeatured())
                .trustedSeller(animal.getTrustedSeller())
                .status(animal.getStatus())
                .userId(animal.getUserId())
                .createdAt(animal.getCreatedAt())
                .images(
                        animal.getImages()
                                .stream()
                                .map(AnimalImage::getImageUrl)
                                .toList()
                )
                .build();
    }

    // ──────────────────────────────────────────────
    // HELPER
    // ──────────────────────────────────────────────
    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "jpg";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}