package com.example.amanafarm_backend.controller;
import com.example.amanafarm_backend.dto.ProductRequest;
import com.example.amanafarm_backend.dto.ProductResponse;
import com.example.amanafarm_backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    @PostMapping
    public ProductResponse create(@RequestBody ProductRequest req) { return productService.createProduct(req); }

    @GetMapping
    public List<ProductResponse> getAll() { return productService.getAllProducts(); }

    @GetMapping("/{id}")
    public ProductResponse getById(@PathVariable Long id) { return productService.getProductById(id); }

    @PutMapping("/{id}")
    public ProductResponse update(@PathVariable Long id, @RequestBody ProductRequest req) { return productService.updateProduct(id, req); }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) { productService.deleteProduct(id); return "Product deleted"; }
}
