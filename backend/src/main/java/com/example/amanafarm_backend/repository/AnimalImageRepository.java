package com.example.amanafarm_backend.repository;

import com.example.amanafarm_backend.model.AnimalImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AnimalImageRepository extends JpaRepository<AnimalImage, Long> {
    List<AnimalImage> findByAnimalId(Long animalId);
}
