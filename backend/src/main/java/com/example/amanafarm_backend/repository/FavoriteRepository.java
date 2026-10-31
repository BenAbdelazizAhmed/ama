package com.example.amanafarm_backend.repository;
import com.example.amanafarm_backend.model.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface FavoriteRepository extends JpaRepository<Favorite,Long>{
 List<Favorite> findByUserIdOrderByIdDesc(Long userId);
 Optional<Favorite> findByUserIdAndKindAndListingId(Long userId,String kind,Long listingId);
}
