package com.example.amanafarm_backend.repository;

import com.example.amanafarm_backend.model.Animal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AnimalRepository extends JpaRepository<Animal, Long> {
    List<Animal> findByStatusOrderByCreatedAtDesc(String status);
}
