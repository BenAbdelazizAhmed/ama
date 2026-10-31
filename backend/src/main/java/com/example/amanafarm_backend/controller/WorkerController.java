package com.example.amanafarm_backend.controller;

import com.example.amanafarm_backend.model.Worker;
import com.example.amanafarm_backend.repository.WorkerRepository;
import org.springframework.web.bind.annotation.*;
import com.example.amanafarm_backend.service.CurrentUser;
import com.example.amanafarm_backend.service.MediaService;

import java.util.List;

@RestController
@RequestMapping("/api/workers")
public class WorkerController {

    private final CurrentUser currentUser;
    private final WorkerRepository workerRepository;

    public WorkerController(WorkerRepository workerRepository, CurrentUser currentUser) {
        this.workerRepository = workerRepository;
        this.currentUser=currentUser;
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
        validate(worker);
        worker.setUserId(currentUser.require().getId());
        worker.setRating(0.0);
        worker.setReviewCount(0);
        worker.setCompletedJobs(0);
        if (worker.getPrice() == null) worker.setPrice(0);
        if (worker.getAvailable() == null) worker.setAvailable(Boolean.TRUE);
        return workerRepository.save(worker);
    }

    @PutMapping("/{id}")
    public Worker updateWorker(@PathVariable Long id, @RequestBody Worker data) {
        Worker worker = workerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Worker not found"));

        currentUser.assertOwner(worker.getUserId());
        validate(data);
        worker.setName(data.getName());
        worker.setTitle(data.getTitle());
        worker.setCategory(data.getCategory());
        worker.setLocation(data.getLocation());
        worker.setExperience(data.getExperience());



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
        var item=workerRepository.findById(id).orElseThrow(()->new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND,"Annonce introuvable"));
        currentUser.assertOwner(item.getUserId());
        workerRepository.delete(item);
        return "Worker deleted successfully";
    }
    private static void validate(Worker item){
        if(item.getTitle()==null||item.getTitle().trim().length()<3||item.getTitle().length()>140||item.getLocation()==null||item.getLocation().isBlank()||item.getDescription()==null||item.getDescription().length()<10||item.getDescription().length()>2000||item.getPhone()==null||!item.getPhone().matches("[2459][0-9]{7}"))throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST,"Titre, description, region et telephone valides requis");
        if(item.getPrice()==null||item.getPrice()<0)throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST,"Prix invalide");
        MediaService.validateUrl(item.getAvatarUrl());
    }
}
