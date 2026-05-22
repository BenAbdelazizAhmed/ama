package com.example.amanafarm_backend.repository;

import com.example.amanafarm_backend.model.Worker;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WorkerRepository extends JpaRepository<Worker, Long> {

    List<Worker> findByLocationContainingIgnoreCase(String location);

    List<Worker> findByTitleContainingIgnoreCaseOrSkillsContainingIgnoreCase(
            String title,
            String skills
    );

    List<Worker> findByAvailableTrue();
}
