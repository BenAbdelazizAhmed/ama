package com.example.amanafarm_backend.service;
import com.example.amanafarm_backend.model.User;
import com.example.amanafarm_backend.repository.UserRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
@Service
public class CurrentUser {
 private final UserRepository users;
 public CurrentUser(UserRepository users) { this.users=users; }
 public User require() {
  var auth=SecurityContextHolder.getContext().getAuthentication();
  if(auth==null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Connectez-vous pour continuer");
  return users.findByEmail(auth.getName()).or(()->users.findByPhone(auth.getName())).orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Session introuvable"));
 }
 public void assertOwner(Long owner) { if(owner==null || !owner.equals(require().getId())) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Cette annonce ne vous appartient pas"); }
 public String name() { var u=require(); return (String.valueOf(u.getFirstName()==null?"":u.getFirstName())+" "+String.valueOf(u.getLastName()==null?"":u.getLastName())).trim(); }
}
