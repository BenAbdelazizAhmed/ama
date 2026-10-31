package com.example.amanafarm_backend.controller;
import com.example.amanafarm_backend.service.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.*;
@RestController @RequestMapping("/api/media")
public class MediaController {
 private final CurrentUser user;private final MediaService media;
 public MediaController(CurrentUser user,MediaService media){this.user=user;this.media=media;}
 @PostMapping public Map<String,List<String>> upload(@RequestParam("files") List<MultipartFile> files){user.require();return Map.of("urls",media.save(files));}
}
