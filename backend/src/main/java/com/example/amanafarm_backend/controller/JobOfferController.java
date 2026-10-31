package com.example.amanafarm_backend.controller;

import com.example.amanafarm_backend.model.JobOffer;
import com.example.amanafarm_backend.repository.JobOfferRepository;
import org.springframework.web.bind.annotation.*;
import com.example.amanafarm_backend.service.CurrentUser;
import com.example.amanafarm_backend.service.MediaService;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobOfferController {

    private final CurrentUser currentUser;
    private final JobOfferRepository jobOfferRepository;

    public JobOfferController(JobOfferRepository jobOfferRepository, CurrentUser currentUser) {
        this.jobOfferRepository = jobOfferRepository;
        this.currentUser=currentUser;
    }

    @GetMapping
    public List<JobOffer> getAllJobs() {
        return jobOfferRepository.findAll();
    }

    @GetMapping("/search")
    public List<JobOffer> searchJobs(@RequestParam String q) {
        return jobOfferRepository.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(q, q);
    }

    @GetMapping("/region")
    public List<JobOffer> getJobsByRegion(@RequestParam String region) {
        return jobOfferRepository.findByLocationContainingIgnoreCase(region);
    }

    @GetMapping("/{id}")
    public JobOffer getJobById(@PathVariable Long id) {
        return jobOfferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found"));
    }

    @PostMapping
    public JobOffer createJob(@RequestBody JobOffer jobOffer) {
        jobOffer.setId(null);
        validate(jobOffer);
        jobOffer.setUserId(currentUser.require().getId());
        return jobOfferRepository.save(jobOffer);
    }

    @PutMapping("/{id}")
    public JobOffer updateJob(@PathVariable Long id, @RequestBody JobOffer data) {
        JobOffer j = jobOfferRepository.findById(id).orElseThrow(() -> new RuntimeException("Job not found"));
        currentUser.assertOwner(j.getUserId());
        validate(data);
        j.setPhone(data.getPhone());
        j.setTitle(data.getTitle());
        j.setEmployer(data.getEmployer());
        j.setLogo(data.getLogo());
        j.setLocation(data.getLocation());
        j.setJobType(data.getJobType());
        j.setSalary(data.getSalary());
        j.setPeriod(data.getPeriod());
        j.setBadge(data.getBadge());
        j.setBadgeText(data.getBadgeText());
        j.setDescription(data.getDescription());
        j.setTags(data.getTags());
        j.setDeadline(data.getDeadline());
        return jobOfferRepository.save(j);
    }

    @DeleteMapping("/{id}")
    public String deleteJob(@PathVariable Long id) {
        var item=jobOfferRepository.findById(id).orElseThrow(()->new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND,"Annonce introuvable"));
        currentUser.assertOwner(item.getUserId());
        jobOfferRepository.delete(item);
        return "Job deleted successfully";
    }
    private static void validate(JobOffer item){
        if(item.getTitle()==null||item.getTitle().trim().length()<3||item.getTitle().length()>140||item.getLocation()==null||item.getLocation().isBlank()||item.getDescription()==null||item.getDescription().length()<10||item.getDescription().length()>2000||item.getPhone()==null||!item.getPhone().matches("[2459][0-9]{7}"))throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST,"Titre, description, region et telephone valides requis");
        MediaService.validateUrl(item.getLogo());
    }
}
