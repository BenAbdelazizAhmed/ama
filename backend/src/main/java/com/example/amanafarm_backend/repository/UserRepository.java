package com.example.amanafarm_backend.repository;

import com.example.amanafarm_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    Optional<User> findByAuthProviderAndProviderId(String authProvider, String providerId);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
}
