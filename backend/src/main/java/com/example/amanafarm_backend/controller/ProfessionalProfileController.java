package com.example.amanafarm_backend.controller;

import com.example.amanafarm_backend.model.ProfessionalProfile;
import com.example.amanafarm_backend.repository.ProfessionalProfileRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/profiles")
public class ProfessionalProfileController {

    private final ProfessionalProfileRepository repository;

    public ProfessionalProfileController(ProfessionalProfileRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<ProfessionalProfile> getAllProfiles() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ProfessionalProfile getProfileById(@PathVariable Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
    }

    @PostMapping
    public ProfessionalProfile createProfile(@RequestBody ProfessionalProfile profile) {
        profile.setId(null);
        profile.setStatus("PENDING_REVIEW");
        profile.setCreatedAt(LocalDateTime.now());
        return repository.save(profile);
    }

    @PutMapping("/{id}")
    public ProfessionalProfile updateProfile(@PathVariable Long id, @RequestBody ProfessionalProfile data) {
        ProfessionalProfile p = repository.findById(id).orElseThrow(() -> new RuntimeException("Profile not found"));
        p.setFullName(data.getFullName());
        p.setRegion(data.getRegion());
        p.setServiceType(data.getServiceType());
        p.setExperienceDescription(data.getExperienceDescription());
        p.setPrice(data.getPrice());
        p.setPeriod(data.getPeriod());
        p.setAvailability(data.getAvailability());
        p.setPlan(data.getPlan());
        p.setPhone(data.getPhone());
        p.setAvatarUrl(data.getAvatarUrl());
        p.setCoverUrl(data.getCoverUrl());
        p.setSkills(data.getSkills());
        return repository.save(p);
    }

    @DeleteMapping("/{id}")
    public String deleteProfile(@PathVariable Long id) {
        repository.deleteById(id);
        return "Profile deleted successfully";
    }
}
