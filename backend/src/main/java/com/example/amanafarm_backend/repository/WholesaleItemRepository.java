package com.example.amanafarm_backend.repository;
import com.example.amanafarm_backend.model.WholesaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WholesaleItemRepository extends JpaRepository<WholesaleItem, Long> {
    List<WholesaleItem> findByCategoryContainingIgnoreCase(String category);
    List<WholesaleItem> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String title, String desc);
}
