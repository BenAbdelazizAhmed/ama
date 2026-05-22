package com.example.amanafarm_backend.auth;

public class AuthResponse {

    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private String avatar;
    private String profilePhoto;
    private String coverPhoto;
    private String message;
    private String token;

    public AuthResponse(Long id, String fullName, String email, String phone, String role,
                        String avatar, String profilePhoto, String coverPhoto, String message, String token) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.role = role;
        this.avatar = avatar;
        this.profilePhoto = profilePhoto;
        this.coverPhoto = coverPhoto;
        this.message = message;
        this.token = token;
    }

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getRole() { return role; }
    public String getAvatar() { return avatar; }
    public String getProfilePhoto() { return profilePhoto; }
    public String getCoverPhoto() { return coverPhoto; }
    public String getMessage() { return message; }
    public String getToken() { return token; }
}
