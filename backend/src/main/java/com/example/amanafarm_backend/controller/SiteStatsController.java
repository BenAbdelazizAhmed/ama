package com.example.amanafarm_backend.controller;

import com.example.amanafarm_backend.dto.SiteStatsResponse;
import com.example.amanafarm_backend.service.SiteStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class SiteStatsController {

    private final SiteStatsService siteStatsService;

    @GetMapping("/overview")
    public SiteStatsResponse overview() {
        return siteStatsService.overview();
    }

    @PostMapping("/visit")
    public SiteStatsResponse recordVisit(@RequestBody(required = false) java.util.Map<String, String> body) {
        String visitorKey = body != null ? body.getOrDefault("visitorKey", "anonymous") : "anonymous";
        return siteStatsService.recordVisit(visitorKey);
    }
}
