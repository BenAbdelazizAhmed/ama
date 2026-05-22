package com.example.amanafarm_backend.controller;

import com.example.amanafarm_backend.model.ServiceRequest;
import com.example.amanafarm_backend.repository.ServiceRequestRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/service-requests")
public class ServiceRequestController {

    private final ServiceRequestRepository repository;

    public ServiceRequestController(ServiceRequestRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<ServiceRequest> getAllRequests() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ServiceRequest getRequestById(@PathVariable Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Request not found"));
    }

    @PostMapping
    public ServiceRequest createRequest(@RequestBody ServiceRequest request) {
        request.setId(null);
        request.setStatus("PENDING");
        request.setCreatedAt(LocalDateTime.now());
        return repository.save(request);
    }

    @PutMapping("/{id}")
    public ServiceRequest updateRequest(@PathVariable Long id, @RequestBody ServiceRequest data) {
        ServiceRequest r = repository.findById(id).orElseThrow(() -> new RuntimeException("Request not found"));
        r.setRequestTitle(data.getRequestTitle());
        r.setRegion(data.getRegion());
        r.setServiceType(data.getServiceType());
        r.setDetails(data.getDetails());
        r.setBudget(data.getBudget());
        r.setPeriod(data.getPeriod());
        r.setAvailability(data.getAvailability());
        return repository.save(r);
    }

    @DeleteMapping("/{id}")
    public String deleteRequest(@PathVariable Long id) {
        repository.deleteById(id);
        return "Request deleted successfully";
    }
}
