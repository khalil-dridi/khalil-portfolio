package com.khalildridi.career.controller;

import com.khalildridi.career.dto.response.CareerResponse;
import com.khalildridi.career.service.CareerService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/career")
public class CareerController {
    private final CareerService service;
    public CareerController(CareerService service) { this.service = service; }
    @GetMapping public CareerResponse career() { return service.career(); }
}
