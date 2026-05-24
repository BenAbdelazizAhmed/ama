package com.example.amanafarm_backend.dto;

public record SiteStatsResponse(
        long publishedAds,
        long siteVisits,
        long registeredUsers
) {
}
