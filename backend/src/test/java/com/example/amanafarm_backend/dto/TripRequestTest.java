package com.example.amanafarm_backend.dto;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;

class TripRequestTest {
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
    private TripRequest request(int capacity, String price, String phone) {
        return new TripRequest("تونس", "سوسة", LocalDateTime.of(2030,1,1,9,0), "أغنام", capacity, new BigDecimal(price), "شاحنة مهيّأة", "", phone, false);
    }
    @Test void acceptsValidTrip() { assertTrue(validator.validate(request(3,"25.50","22123456")).isEmpty()); }
    @Test void rejectsNegativePrice() { assertFalse(validator.validate(request(3,"-1","22123456")).isEmpty()); }
    @Test void rejectsExcessivePrecision() { assertFalse(validator.validate(request(3,"25.555","22123456")).isEmpty()); }
    @Test void rejectsInvalidCapacity() {
        assertFalse(validator.validate(request(0,"25","22123456")).isEmpty());
        assertFalse(validator.validate(request(201,"25","22123456")).isEmpty());
    }
    @Test void rejectsMalformedContactNumber() {
        for (String phone : new String[]{"12345678", "22123", "+21622123456", "abcdefgh"}) {
            assertFalse(validator.validate(request(3,"25",phone)).isEmpty());
        }
    }
}
