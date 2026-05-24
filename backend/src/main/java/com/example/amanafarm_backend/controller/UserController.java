package com.example.amanafarm_backend.controller;

import com.example.amanafarm_backend.dto.UserProfileResponse;
import com.example.amanafarm_backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Non authentifie"));
        }

        return userRepository.findByEmail(authentication.getName())
                .<ResponseEntity<?>>map(user -> ResponseEntity.ok(UserProfileResponse.from(user)))
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "Utilisateur introuvable")));
    }
}
