package com.example.amanafarm_backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String password;
    private String avatar;
    private String profilePhoto;
    private String coverPhoto;
}
