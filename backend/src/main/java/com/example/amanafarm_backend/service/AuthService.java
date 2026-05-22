package com.example.amanafarm_backend.service;

import com.example.amanafarm_backend.auth.AuthResponse;
import com.example.amanafarm_backend.auth.LoginRequest;
import com.example.amanafarm_backend.auth.RegisterRequest;
import com.example.amanafarm_backend.exception.UnauthorizedAuthException;
import com.example.amanafarm_backend.model.User;
import com.example.amanafarm_backend.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        String normalizedPhone = normalizePhone(request.getPhone());

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new RuntimeException("Email deja utilise");
        }
        if (userRepository.existsByPhone(normalizedPhone)) {
            throw new RuntimeException("Telephone deja utilise");
        }

        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(normalizedEmail);
        user.setPhone(normalizedPhone);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("CLIENT");
        user.setAvatar(request.getAvatar());
        user.setProfilePhoto(request.getProfilePhoto());
        user.setCoverPhoto(request.getCoverPhoto());

        userRepository.save(user);

        return toResponse(user, "Compte cree avec succes");
    }

    public AuthResponse login(LoginRequest request) {
        String identifier = request.getEmail() == null ? "" : request.getEmail().trim();
        String password = request.getPassword();
        if (identifier.isEmpty() || password == null || password.isEmpty()) {
            throw new UnauthorizedAuthException("Email ou mot de passe manquant");
        }
        String normalizedEmail = normalizeEmail(identifier);
        String normalizedPhone = normalizePhone(identifier);

        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail)
                .or(() -> userRepository.findByPhone(normalizedPhone));

        if (userOpt.isEmpty() && normalizedPhone.startsWith("216") && normalizedPhone.length() > 3) {
            userOpt = userRepository.findByPhone(normalizedPhone.substring(3));
        }
        if (userOpt.isEmpty() && !normalizedPhone.startsWith("216") && normalizedPhone.length() >= 8) {
            userOpt = userRepository.findByPhone("216" + normalizedPhone);
        }

        User user = userOpt.orElseThrow(() -> new UnauthorizedAuthException("Utilisateur introuvable"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new UnauthorizedAuthException("Mot de passe incorrect");
        }

        return toResponse(user, "Connexion reussie");
    }

    private AuthResponse toResponse(User user, String message) {
        String token = jwtService.generateToken(user);
        return new AuthResponse(
                user.getId(),
                user.getFirstName() + " " + user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getAvatar(),
                user.getProfilePhoto(),
                user.getCoverPhoto(),
                message,
                token
        );
    }

    private String normalizeEmail(String value) {
        if (value == null) return "";
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizePhone(String value) {
        if (value == null) return "";
        return value.replaceAll("\\D", "");
    }
}
