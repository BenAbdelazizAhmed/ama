package com.example.amanafarm_backend.repository;

import com.example.amanafarm_backend.model.SiteVisit;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SiteVisitRepository extends JpaRepository<SiteVisit, Long> {
    Optional<SiteVisit> findByVisitorKey(String visitorKey);
}
