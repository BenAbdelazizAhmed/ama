package com.example.amanafarm_backend.service;

import com.example.amanafarm_backend.dto.TripRequest;
import com.example.amanafarm_backend.model.CarpoolTrip;
import com.example.amanafarm_backend.repository.CarpoolTripRepository;
import com.example.amanafarm_backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;

@Service
public class CarpoolTripService {
    private static final Set<String> REGIONS = Set.of("تونس","أريانة","بن عروس","منوبة","بنزرت","نابل","زغوان","باجة","جندوبة","الكاف","سليانة","سوسة","المنستير","المهدية","صفاقس","القيروان","القصرين","سيدي بوزيد","قابس","مدنين","تطاوين","قفصة","توزر","قبلي");
    private static final Set<String> ANIMALS = Set.of("أغنام", "أبقار", "ماعز", "دواجن", "حيوانات أليفة");
    private static final Set<String> VEHICLES = Set.of("شاحنة مهيّأة", "شاحنة خفيفة", "سيارة مع صندوق نقل");
    private final CarpoolTripRepository trips;
    private final UserRepository users;
    private final Clock clock;

    @org.springframework.beans.factory.annotation.Autowired
    public CarpoolTripService(CarpoolTripRepository trips, UserRepository users) {
        this(trips, users, Clock.system(ZoneId.of("Africa/Tunis")));
    }
    // Injectable clock makes expiry rules deterministic in unit tests.
    CarpoolTripService(CarpoolTripRepository trips, UserRepository users, Clock clock) {
        this.trips = trips; this.users = users; this.clock = clock;
    }
    @Transactional(readOnly = true)
    public List<CarpoolTrip> list() { return trips.findByDepartureAfterOrderByDepartureAsc(LocalDateTime.now(clock)); }

    @Transactional
    public CarpoolTrip create(TripRequest req, String email) {
        var user = users.findByEmail(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Compte introuvable"));
        if (!REGIONS.contains(req.origin()) || !REGIONS.contains(req.destination()) || req.origin().equals(req.destination()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choisissez deux gouvernorats distincts");
        if (req.departure() == null || !req.departure().isAfter(LocalDateTime.now(clock)))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le depart doit etre dans le futur (heure de Tunis)");
        if (!ANIMALS.contains(req.animalType()) || !VEHICLES.contains(req.vehicle()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Type d'animal ou vehicule invalide");
        var trip = new CarpoolTrip();
        trip.setOrigin(req.origin()); trip.setDestination(req.destination()); trip.setDeparture(req.departure());
        trip.setAnimalType(req.animalType()); trip.setCapacity(req.capacity()); trip.setPrice(req.price());
        trip.setVehicle(req.vehicle()); trip.setNotes(req.notes() == null ? "" : req.notes().trim());
        trip.setContactPhone(req.contactPhone()); trip.setAccompanied(req.accompanied());
        trip.setOwnerId(user.getId());
        String name = ((user.getFirstName() == null ? "" : user.getFirstName()) + " " + (user.getLastName() == null ? "" : user.getLastName())).trim();
        trip.setDriverName(name.isBlank() ? "عضو AMANAFARM" : name);
        return trips.save(trip);
    }
    @Transactional
    public void delete(Long id, String email) {
        var user = users.findByEmail(email).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Compte introuvable"));
        var trip = trips.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trajet introuvable"));
        if (!trip.getOwnerId().equals(user.getId())) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous ne pouvez supprimer que vos trajets");
        trips.delete(trip);
    }
}
