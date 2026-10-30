package com.example.amanafarm_backend.service;

import com.example.amanafarm_backend.dto.TripRequest;
import com.example.amanafarm_backend.model.CarpoolTrip;
import com.example.amanafarm_backend.model.User;
import com.example.amanafarm_backend.repository.CarpoolTripRepository;
import com.example.amanafarm_backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.*;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CarpoolTripServiceTest {
    private final CarpoolTripRepository trips = mock(CarpoolTripRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final Clock clock = Clock.fixed(Instant.parse("2026-10-30T12:00:00Z"), ZoneId.of("Africa/Tunis"));
    private final CarpoolTripService service = new CarpoolTripService(trips, users, clock);
    @BeforeEach void setup() {
        User user = mock(User.class); when(user.getId()).thenReturn(7L); when(user.getFirstName()).thenReturn("Ahmed"); when(user.getLastName()).thenReturn("Test");
        when(users.findByEmail("owner@example.test")).thenReturn(Optional.of(user));
        when(trips.save(any(CarpoolTrip.class))).thenAnswer(i -> i.getArgument(0));
    }
    private TripRequest request(String origin, String destination, LocalDateTime departure) {
        return new TripRequest(origin, destination, departure, "أغنام", 3, new BigDecimal("25.00"), "شاحنة مهيّأة", "  Point de rencontre  ", "22123456", true);
    }
    @Test void createsTripWithServerOwnedIdentity() {
        var trip = service.create(request("تونس", "سوسة", LocalDateTime.now(clock).plusDays(1)), "owner@example.test");
        assertEquals(7L, trip.getOwnerId()); assertEquals("Ahmed Test", trip.getDriverName());
        assertEquals("Point de rencontre", trip.getNotes()); assertTrue(trip.getAccompanied());
        verify(trips).save(trip);
    }
    @Test void rejectsSameRegion() {
        var error = assertThrows(ResponseStatusException.class, () -> service.create(request("تونس", "تونس", LocalDateTime.now(clock).plusDays(1)), "owner@example.test"));
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode()); verify(trips, never()).save(any());
    }
    @Test void rejectsUnknownRegion() {
        assertThrows(ResponseStatusException.class, () -> service.create(request("Paris", "سوسة", LocalDateTime.now(clock).plusDays(1)), "owner@example.test"));
        verify(trips, never()).save(any());
    }
    @Test void rejectsDepartureAtOrBeforeTunisNow() {
        for (int minutes : new int[]{-60, 0}) {
            assertThrows(ResponseStatusException.class, () -> service.create(request("تونس", "سوسة", LocalDateTime.now(clock).plusMinutes(minutes)), "owner@example.test"));
        }
        verify(trips, never()).save(any());
    }
    @Test void listsOnlyUpcomingTripsUsingTunisTime() {
        service.list(); verify(trips).findByDepartureAfterOrderByDepartureAsc(LocalDateTime.of(2026,10,30,13,0));
    }
    @Test void refusesDeleteByAnotherUser() {
        var trip = new CarpoolTrip(); trip.setId(2L); trip.setOwnerId(99L);
        when(trips.findById(2L)).thenReturn(Optional.of(trip));
        var error = assertThrows(ResponseStatusException.class, () -> service.delete(2L, "owner@example.test"));
        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode()); verify(trips, never()).delete(any());
    }
    @Test void allowsOwnerToDelete() {
        var trip = new CarpoolTrip(); trip.setId(2L); trip.setOwnerId(7L);
        when(trips.findById(2L)).thenReturn(Optional.of(trip));
        service.delete(2L, "owner@example.test"); verify(trips).delete(trip);
    }
    @Test void missingTripReturns404() {
        var error = assertThrows(ResponseStatusException.class, () -> service.delete(999L, "owner@example.test"));
        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
    }
}
