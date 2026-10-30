package com.example.amanafarm_backend.controller;
import com.example.amanafarm_backend.dto.TripRequest;
import com.example.amanafarm_backend.model.CarpoolTrip;
import com.example.amanafarm_backend.service.CarpoolTripService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/trips")
public class CarpoolTripController {
    private final CarpoolTripService service;
    public CarpoolTripController(CarpoolTripService service) { this.service = service; }
    @GetMapping public List<CarpoolTrip> list() { return service.list(); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public CarpoolTrip create(@Valid @RequestBody TripRequest request, Principal principal) {
        if (principal == null) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return service.create(request, principal.getName());
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Principal principal) {
        if (principal == null) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED);
        service.delete(id, principal.getName());
    }
}
