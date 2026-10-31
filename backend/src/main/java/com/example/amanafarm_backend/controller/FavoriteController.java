package com.example.amanafarm_backend.controller;
import com.example.amanafarm_backend.model.Favorite;
import com.example.amanafarm_backend.repository.*;
import com.example.amanafarm_backend.service.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@RestController @RequestMapping("/api/favorites")
public class FavoriteController {
 private final CurrentUser user;private final FavoriteRepository favorites;private final AnimalRepository animals;private final ProductRepository products;private final WholesaleItemRepository wholesale;private final WorkerRepository workers;private final JobOfferRepository jobs;
 public FavoriteController(CurrentUser user,FavoriteRepository favorites,AnimalRepository animals,ProductRepository products,WholesaleItemRepository wholesale,WorkerRepository workers,JobOfferRepository jobs){this.user=user;this.favorites=favorites;this.animals=animals;this.products=products;this.wholesale=wholesale;this.workers=workers;this.jobs=jobs;}
 public record Request(@NotBlank @Pattern(regexp="animals|products|wholesale|services|jobs") String kind,@NotNull @Min(1) Long listingId){}
 @GetMapping public List<Favorite> list(){return favorites.findByUserIdOrderByIdDesc(user.require().getId());}
 @PostMapping @Transactional public Favorite add(@Valid @RequestBody Request request){
  var owner=user.require().getId();
  boolean exists=switch(request.kind()){
   case "animals"->animals.findById(request.listingId()).filter(a->!"DELETED".equals(a.getStatus())).isPresent();
   case "products"->products.existsById(request.listingId());case "wholesale"->wholesale.existsById(request.listingId());case "services"->workers.existsById(request.listingId());case "jobs"->jobs.existsById(request.listingId());default->false;
  };
  if(!exists)throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Annonce introuvable");
  return favorites.findByUserIdAndKindAndListingId(owner,request.kind(),request.listingId()).orElseGet(()->{var f=new Favorite();f.setUserId(owner);f.setKind(request.kind());f.setListingId(request.listingId());return favorites.save(f);});
 }
 @DeleteMapping("/{kind}/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional
 public void delete(@PathVariable String kind,@PathVariable Long id){favorites.findByUserIdAndKindAndListingId(user.require().getId(),kind,id).ifPresent(favorites::delete);}
}
