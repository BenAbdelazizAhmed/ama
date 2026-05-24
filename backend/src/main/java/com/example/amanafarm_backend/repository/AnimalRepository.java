package com.example.amanafarm_backend.repository;

import com.example.amanafarm_backend.model.Animal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AnimalRepository extends JpaRepository<Animal, Long> {
    Optional<Animal> findByTitle(String title);
    List<Animal> findByStatusOrderByCreatedAtDesc(String status);
}
