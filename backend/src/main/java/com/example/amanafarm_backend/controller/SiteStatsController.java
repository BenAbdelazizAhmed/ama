package com.example.amanafarm_backend.controller;

import com.example.amanafarm_backend.dto.SiteStatsResponse;
import com.example.amanafarm_backend.service.SiteStatsService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
public class SiteStatsController {

    private final SiteStatsService siteStatsService;

    public SiteStatsController(SiteStatsService siteStatsService) {
        this.siteStatsService = siteStatsService;
    }

    @GetMapping("/overview")
    public SiteStatsResponse overview() {
        return siteStatsService.overview();
    }

    @PostMapping("/visit")
    public SiteStatsResponse recordVisit(@RequestBody(required = false) Map<String, String> body) {
        String visitorKey = body == null ? "" : body.getOrDefault("visitorKey", "");
        return siteStatsService.recordVisit(visitorKey);
    }
}
