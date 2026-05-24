package com.example.amanafarm_backend.repository;
import com.example.amanafarm_backend.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findByTitle(String title);
    List<Product> findAllByOrderByCreatedAtDesc();
    List<Product> findByCategoryContainingIgnoreCase(String category);
    List<Product> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String title, String desc);
}
