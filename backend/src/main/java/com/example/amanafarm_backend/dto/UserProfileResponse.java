package com.example.amanafarm_backend.dto;

import com.example.amanafarm_backend.model.User;
import com.example.amanafarm_backend.model.UserRole;

public record UserProfileResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String role,
        String avatar,
        String profilePhoto,
        String coverPhoto
) {
    public static UserProfileResponse from(User user) {
        String fullName = ((user.getFirstName() == null ? "" : user.getFirstName()) + " " +
                (user.getLastName() == null ? "" : user.getLastName())).trim();
        if (fullName.isBlank()) fullName = user.getEmail();

        return new UserProfileResponse(
                user.getId(),
                fullName,
                user.getEmail(),
                user.getPhone(),
                UserRole.normalize(user.getRole()),
                user.getAvatar(),
                user.getProfilePhoto(),
                user.getCoverPhoto()
        );
    }
}
