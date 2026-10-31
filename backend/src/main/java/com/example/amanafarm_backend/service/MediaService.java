package com.example.amanafarm_backend.service;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.nio.file.*;
import java.io.IOException;
import java.util.*;
@Service
public class MediaService {
 private final Path directory;
 public MediaService(@Value("${app.upload.dir:./uploads}") String path){directory=Path.of(path).toAbsolutePath().normalize();}
 public List<String> save(List<MultipartFile> files) {
  if(files==null || files.isEmpty() || files.size()>6) throw bad("Ajoutez entre 1 et 6 photos");
  var contents=new ArrayList<byte[]>();var extensions=new ArrayList<String>();
  for(var file:files){
   if(file.isEmpty() || file.getSize()>5*1024*1024)throw bad("Photo vide ou superieure a 5 Mo");
   try{var data=file.getBytes();extensions.add(extension(data));contents.add(data);}catch(IOException ex){throw bad("Photo illisible");}
  }
  var written=new ArrayList<Path>();var urls=new ArrayList<String>();
  try{Files.createDirectories(directory);for(int i=0;i<contents.size();i++){var name=UUID.randomUUID()+"."+extensions.get(i);var path=directory.resolve(name);Files.write(path,contents.get(i),StandardOpenOption.CREATE_NEW);written.add(path);urls.add("/uploads/"+name);}return urls;}
  catch(IOException ex){for(var path:written)try{Files.deleteIfExists(path);}catch(IOException ignored){}throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Impossible d'enregistrer les photos");}
 }
 private static String extension(byte[] b){
  if(b.length>=3&&(b[0]&255)==255&&(b[1]&255)==216&&(b[2]&255)==255)return "jpg";
  if(b.length>=8&&Arrays.equals(Arrays.copyOf(b,8),new byte[]{(byte)137,80,78,71,13,10,26,10}))return "png";
  if(b.length>=12&&new String(b,0,4,java.nio.charset.StandardCharsets.US_ASCII).equals("RIFF")&&new String(b,8,4,java.nio.charset.StandardCharsets.US_ASCII).equals("WEBP"))return "webp";
  throw bad("Formats acceptes : JPEG, PNG et WebP");
 }
 public static void validateUrls(List<String> urls){if(urls!=null){if(urls.size()>6)throw bad("Maximum 6 photos");urls.forEach(MediaService::validateUrl);}}
 public static void validateUrl(String url){if(url==null||url.isBlank())return;if(url.length()>2048||url.contains("..")||!(url.startsWith("/uploads/")||url.startsWith("assets/")||url.startsWith("https://")||url.startsWith("http://localhost:")))throw bad("URL de photo invalide");}
 private static ResponseStatusException bad(String text){return new ResponseStatusException(HttpStatus.BAD_REQUEST,text);}
}
