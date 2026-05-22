package com.example.amanafarm_backend.repository;

import com.example.amanafarm_backend.model.ServiceRequest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {
}
