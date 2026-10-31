package com.example.amanafarm_backend.controller;
import com.example.amanafarm_backend.dto.UserProfileResponse;
import com.example.amanafarm_backend.repository.UserRepository;
import com.example.amanafarm_backend.service.CurrentUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.Map;
@RestController @RequestMapping("/api/users")
public class UserController {
 private final UserRepository users;private final CurrentUser current;private final BCryptPasswordEncoder passwords=new BCryptPasswordEncoder();
 public UserController(UserRepository users,CurrentUser current){this.users=users;this.current=current;}
 public record Profile(@NotBlank @Size(max=50) String firstName,@NotBlank @Size(max=50) String lastName,@NotBlank @Pattern(regexp="[2459][0-9]{7}") String phone){}
 public record Password(@NotBlank String currentPassword,@NotBlank @Size(min=8,max=72) String newPassword){}
 @GetMapping("/me") public UserProfileResponse me(){return UserProfileResponse.from(current.require());}
 @PutMapping("/me") public UserProfileResponse update(@Valid @RequestBody Profile request){
  var user=current.require();
  if(users.findByPhone(request.phone()).filter(u->!u.getId().equals(user.getId())).isPresent())throw new ResponseStatusException(HttpStatus.CONFLICT,"Telephone deja utilise");
  user.setFirstName(request.firstName().trim());user.setLastName(request.lastName().trim());user.setPhone(request.phone());return UserProfileResponse.from(users.save(user));
 }
 @PutMapping("/me/password") public Map<String,String> password(@Valid @RequestBody Password request){
  var user=current.require();
  if(user.getPassword()==null||!passwords.matches(request.currentPassword(),user.getPassword()))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Mot de passe actuel incorrect");
  user.setPassword(passwords.encode(request.newPassword()));users.save(user);return Map.of("message","Mot de passe modifie");
 }
}
