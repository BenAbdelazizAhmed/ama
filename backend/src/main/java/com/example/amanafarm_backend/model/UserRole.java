package com.example.amanafarm_backend.model;

public enum UserRole {
    BUYER,
    SELLER,
    FARMER,
    SERVICE_PROVIDER,
    ADMIN;

    public static String normalize(String value) {
        if (value == null || value.isBlank()) return BUYER.name();
        String role = value.trim().toUpperCase();
        return switch (role) {
            case "CLIENT", "USER", "ACHETEUR" -> BUYER.name();
            case "VENDEUR" -> SELLER.name();
            case "AGRICULTEUR", "ELEVEUR" -> FARMER.name();
            case "PRESTATAIRE" -> SERVICE_PROVIDER.name();
            case "ADMIN" -> ADMIN.name();
            default -> role;
        };
    }
}
