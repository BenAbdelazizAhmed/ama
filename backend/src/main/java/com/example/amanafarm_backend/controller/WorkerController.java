package com.example.amanafarm_backend.controller;

import com.example.amanafarm_backend.model.Worker;
import com.example.amanafarm_backend.repository.WorkerRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workers")
public class WorkerController {

    private final WorkerRepository workerRepository;

    public WorkerController(WorkerRepository workerRepository) {
        this.workerRepository = workerRepository;
    }

    @GetMapping
    public List<Worker> getAllWorkers() {
        return workerRepository.findAll();
    }

    /** Literal paths must be registered before `/{id}` so "search" is not parsed as an id. */
    @GetMapping("/search")
    public List<Worker> searchWorkers(@RequestParam String q) {
        return workerRepository.findByTitleContainingIgnoreCaseOrSkillsContainingIgnoreCase(q, q);
    }

    @GetMapping("/region")
    public List<Worker> getWorkersByRegion(@RequestParam String region) {
        return workerRepository.findByLocationContainingIgnoreCase(region);
    }

    @GetMapping("/available")
    public List<Worker> getAvailableWorkers() {
        return workerRepository.findByAvailableTrue();
    }

    @GetMapping("/{id}")
    public Worker getWorkerById(@PathVariable Long id) {
        return workerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Worker not found"));
    }

    @PostMapping
    public Worker createWorker(@RequestBody Worker worker) {
        worker.setId(null);
        if (worker.getRating() == null) worker.setRating(0.0);
        if (worker.getReviewCount() == null) worker.setReviewCount(0);
        if (worker.getCompletedJobs() == null) worker.setCompletedJobs(0);
        if (worker.getPrice() == null) worker.setPrice(0);
        if (worker.getAvailable() == null) worker.setAvailable(Boolean.TRUE);
        return workerRepository.save(worker);
    }

    @PutMapping("/{id}")
    public Worker updateWorker(@PathVariable Long id, @RequestBody Worker data) {
        Worker worker = workerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Worker not found"));

        worker.setName(data.getName());
        worker.setTitle(data.getTitle());
        worker.setLocation(data.getLocation());
        worker.setExperience(data.getExperience());
        worker.setRating(data.getRating());
        worker.setReviewCount(data.getReviewCount());
        worker.setCompletedJobs(data.getCompletedJobs());
        worker.setResponseTime(data.getResponseTime());
        worker.setPrice(data.getPrice());
        worker.setPriceUnit(data.getPriceUnit());
        worker.setAvailable(data.getAvailable());
        worker.setSkills(data.getSkills());
        worker.setAvatarUrl(data.getAvatarUrl());
        worker.setCoverUrl(data.getCoverUrl());
        worker.setPhone(data.getPhone());
        worker.setDescription(data.getDescription());

        return workerRepository.save(worker);
    }

    @DeleteMapping("/{id}")
    public String deleteWorker(@PathVariable Long id) {
        workerRepository.deleteById(id);
        return "Worker deleted successfully";
    }
}
