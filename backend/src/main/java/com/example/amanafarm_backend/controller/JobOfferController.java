package com.example.amanafarm_backend.controller;

import com.example.amanafarm_backend.model.JobOffer;
import com.example.amanafarm_backend.repository.JobOfferRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobOfferController {

    private final JobOfferRepository jobOfferRepository;

    public JobOfferController(JobOfferRepository jobOfferRepository) {
        this.jobOfferRepository = jobOfferRepository;
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
        return jobOfferRepository.save(jobOffer);
    }

    @PutMapping("/{id}")
    public JobOffer updateJob(@PathVariable Long id, @RequestBody JobOffer data) {
        JobOffer j = jobOfferRepository.findById(id).orElseThrow(() -> new RuntimeException("Job not found"));
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
        jobOfferRepository.deleteById(id);
        return "Job deleted successfully";
    }
}
