package com.example.amanafarm_backend.auth;

import jakarta.validation.constraints.*;

public class RegisterRequest {
    @NotBlank @Size(max=50) private String firstName;
    @NotBlank @Size(max=50) private String lastName;
    @NotBlank @Email @Size(max=100) private String email;
    @NotBlank @Pattern(regexp="(?:216)?[2459][0-9]{7}") private String phone;
    @NotBlank @Size(min=8,max=72) private String password;
    private String avatar;
    private String profilePhoto;
    private String coverPhoto;

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public String getProfilePhoto() { return profilePhoto; }
    public void setProfilePhoto(String profilePhoto) { this.profilePhoto = profilePhoto; }

    public String getCoverPhoto() { return coverPhoto; }
    public void setCoverPhoto(String coverPhoto) { this.coverPhoto = coverPhoto; }
}
