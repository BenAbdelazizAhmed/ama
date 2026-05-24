package com.example.amanafarm_backend.service;

import com.example.amanafarm_backend.dto.SiteStatsResponse;
import com.example.amanafarm_backend.model.SiteVisit;
import com.example.amanafarm_backend.repository.AnimalRepository;
import com.example.amanafarm_backend.repository.ProductRepository;
import com.example.amanafarm_backend.repository.SiteVisitRepository;
import com.example.amanafarm_backend.repository.UserRepository;
import com.example.amanafarm_backend.repository.WholesaleItemRepository;
import java.time.Instant;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SiteStatsService {

    private final AnimalRepository animalRepository;
    private final ProductRepository productRepository;
    private final WholesaleItemRepository wholesaleItemRepository;
    private final UserRepository userRepository;
    private final SiteVisitRepository siteVisitRepository;

    public SiteStatsService(
            AnimalRepository animalRepository,
            ProductRepository productRepository,
            WholesaleItemRepository wholesaleItemRepository,
            UserRepository userRepository,
            SiteVisitRepository siteVisitRepository
    ) {
        this.animalRepository = animalRepository;
        this.productRepository = productRepository;
        this.wholesaleItemRepository = wholesaleItemRepository;
        this.userRepository = userRepository;
        this.siteVisitRepository = siteVisitRepository;
    }

    public SiteStatsResponse overview() {
        long publishedAds = animalRepository.count()
                + productRepository.count()
                + wholesaleItemRepository.count();
        return new SiteStatsResponse(
                publishedAds,
                siteVisitRepository.count(),
                userRepository.count()
        );
    }

    @Transactional
    public SiteStatsResponse recordVisit(String visitorKey) {
        String safeKey = sanitizeVisitorKey(visitorKey);
        Instant now = Instant.now();
        SiteVisit visit = siteVisitRepository.findByVisitorKey(safeKey).orElseGet(() -> {
            SiteVisit created = new SiteVisit();
            created.setVisitorKey(safeKey);
            created.setFirstSeenAt(now);
            created.setVisits(0);
            return created;
        });

        visit.setLastSeenAt(now);
        visit.setVisits(visit.getVisits() + 1);
        siteVisitRepository.save(visit);

        return overview();
    }

    private String sanitizeVisitorKey(String visitorKey) {
        String key = String.valueOf(visitorKey == null ? "" : visitorKey).trim();
        if (key.isEmpty()) {
            return "anonymous-" + Instant.now().toEpochMilli();
        }
        return key.length() > 120 ? key.substring(0, 120) : key;
    }
}
