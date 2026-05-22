package com.example.amanafarm_backend.controller;
import com.example.amanafarm_backend.dto.WholesaleItemRequest;
import com.example.amanafarm_backend.dto.WholesaleItemResponse;
import com.example.amanafarm_backend.service.WholesaleItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/wholesale")
@RequiredArgsConstructor
public class WholesaleItemController {
    private final WholesaleItemService wholesaleItemService;

    @PostMapping
    public WholesaleItemResponse create(@RequestBody WholesaleItemRequest req) { return wholesaleItemService.createItem(req); }

    @GetMapping
    public List<WholesaleItemResponse> getAll() { return wholesaleItemService.getAllItems(); }

    @GetMapping("/{id}")
    public WholesaleItemResponse getById(@PathVariable Long id) { return wholesaleItemService.getItemById(id); }

    @PutMapping("/{id}")
    public WholesaleItemResponse update(@PathVariable Long id, @RequestBody WholesaleItemRequest req) { return wholesaleItemService.updateItem(id, req); }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) { wholesaleItemService.deleteItem(id); return "Wholesale item deleted"; }
}
