package com.example.amanafarm_backend.repository;
import com.example.amanafarm_backend.model.CarpoolTrip;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
public interface CarpoolTripRepository extends JpaRepository<CarpoolTrip, Long> {
    List<CarpoolTrip> findByDepartureAfterOrderByDepartureAsc(LocalDateTime now);
}
