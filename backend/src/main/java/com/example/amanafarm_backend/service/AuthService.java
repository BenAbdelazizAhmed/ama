package com.example.amanafarm_backend.service;

import com.example.amanafarm_backend.auth.AuthResponse;
import com.example.amanafarm_backend.auth.LoginRequest;
import com.example.amanafarm_backend.auth.RegisterRequest;
import com.example.amanafarm_backend.auth.SocialLoginRequest;
import com.example.amanafarm_backend.exception.UnauthorizedAuthException;
import com.example.amanafarm_backend.model.User;
import com.example.amanafarm_backend.model.UserRole;
import com.example.amanafarm_backend.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final RestTemplate restTemplate = new RestTemplate();

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
        user.setRole(UserRole.BUYER.name());
        user.setAvatar(request.getAvatar());
        user.setProfilePhoto(request.getProfilePhoto());
        user.setCoverPhoto(request.getCoverPhoto());
        user.setAuthProvider("local");
        user.setLastLoginAt(Instant.now());

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

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        return toResponse(user, "Connexion reussie");
    }

    public AuthResponse socialLogin(SocialLoginRequest request) {
        String provider = request.getProvider() == null ? "" : request.getProvider().trim().toLowerCase(Locale.ROOT);
        String token = request.getToken() == null ? "" : request.getToken().trim();
        if (provider.isEmpty() || token.isEmpty()) {
            throw new UnauthorizedAuthException("Provider ou token manquant");
        }

        SocialProfile profile = switch (provider) {
            case "google" -> verifyGoogleToken(token);
            case "facebook" -> verifyFacebookToken(token);
            default -> throw new UnauthorizedAuthException("Provider social non supporte");
        };

        String email = normalizeEmail(profile.email());
        if (email.isEmpty()) {
            email = normalizeEmail(request.getEmail());
        }
        if (email.isEmpty()) {
            throw new UnauthorizedAuthException("Email social non disponible");
        }

        final String socialEmail = email;
        final String providerId = firstNonBlank(profile.providerId(), socialEmail);
        final String fullName = firstNonBlank(profile.name(), request.getFullName(), socialEmail.split("@")[0]);
        final String avatar = firstNonBlank(profile.picture(), request.getAvatar(), provider.equals("google") ? "G" : "f");

        User user = userRepository.findByAuthProviderAndProviderId(provider, providerId)
                .or(() -> userRepository.findByEmail(socialEmail))
                .orElseGet(() -> {
            User created = new User();
            applyName(created, fullName);
            created.setEmail(socialEmail);
            created.setPhone("");
            created.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            created.setRole(UserRole.BUYER.name());
            created.setAvatar(avatar);
            created.setProfilePhoto(avatar.startsWith("http") ? avatar : null);
            created.setAuthProvider(provider);
            created.setProviderId(providerId);
            created.setLastLoginAt(Instant.now());
            return userRepository.save(created);
        });

        user.setAuthProvider(provider);
        user.setProviderId(providerId);
        user.setLastLoginAt(Instant.now());
        if (user.getAvatar() == null || user.getAvatar().isBlank()) {
            user.setAvatar(avatar);
            if (avatar.startsWith("http")) user.setProfilePhoto(avatar);
        }
        userRepository.save(user);

        return toResponse(user, "Connexion sociale reussie");
    }

    private AuthResponse toResponse(User user, String message) {
        String token = jwtService.generateToken(user);
        String role = UserRole.normalize(user.getRole());
        return new AuthResponse(
                user.getId(),
                user.getFirstName() + " " + user.getLastName(),
                user.getEmail(),
                user.getPhone(),
                role,
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

    private SocialProfile verifyGoogleToken(String idToken) {
        try {
            String url = UriComponentsBuilder
                    .fromUriString("https://oauth2.googleapis.com/tokeninfo")
                    .queryParam("id_token", idToken)
                    .toUriString();
            Map<?, ?> data = restTemplate.getForObject(url, Map.class);
            if (data == null || data.get("email") == null) {
                throw new UnauthorizedAuthException("Token Google invalide");
            }
            return new SocialProfile(
                    mapString(data, "email"),
                    mapString(data, "name"),
                    mapString(data, "picture"),
                    mapString(data, "sub")
            );
        } catch (UnauthorizedAuthException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new UnauthorizedAuthException("Verification Google echouee");
        }
    }

    private SocialProfile verifyFacebookToken(String accessToken) {
        try {
            String url = UriComponentsBuilder
                    .fromUriString("https://graph.facebook.com/me")
                    .queryParam("fields", "id,name,email,picture.type(large)")
                    .queryParam("access_token", accessToken)
                    .toUriString();
            Map<?, ?> data = restTemplate.getForObject(url, Map.class);
            if (data == null || data.get("id") == null) {
                throw new UnauthorizedAuthException("Token Facebook invalide");
            }

            String picture = "";
            Object pictureObj = data.get("picture");
            if (pictureObj instanceof Map<?, ?> pictureMap) {
                Object pictureDataObj = pictureMap.get("data");
                if (pictureDataObj instanceof Map<?, ?> pictureData) {
                    picture = mapString(pictureData, "url");
                }
            }

            return new SocialProfile(
                    mapString(data, "email"),
                    mapString(data, "name"),
                    picture,
                    mapString(data, "id")
            );
        } catch (UnauthorizedAuthException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new UnauthorizedAuthException("Verification Facebook echouee");
        }
    }

    private void applyName(User user, String fullName) {
        String cleaned = fullName == null ? "" : fullName.trim();
        if (cleaned.isEmpty()) {
            user.setFirstName("AMANAFARM");
            user.setLastName("User");
            return;
        }
        String[] parts = cleaned.split("\\s+", 2);
        user.setFirstName(parts[0]);
        user.setLastName(parts.length > 1 ? parts[1] : "");
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.trim().isEmpty()) return value.trim();
        }
        return "";
    }

    private String mapString(Map<?, ?> data, String key) {
        Object value = data.get(key);
        return value == null ? "" : String.valueOf(value);
    }

    private record SocialProfile(String email, String name, String picture, String providerId) {}
}
