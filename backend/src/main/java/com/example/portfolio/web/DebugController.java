package com.example.portfolio.web;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/debug")
public class DebugController {
    
    @Autowired
    private ApplicationContext applicationContext;
    
    @GetMapping("/beans")
    public ResponseEntity<List<String>> getBeans() {
        String[] beanNames = applicationContext.getBeanDefinitionNames();
        List<String> securityBeans = Arrays.stream(beanNames)
                .filter(name -> name.toLowerCase().contains("security") || 
                               name.toLowerCase().contains("jwt") || 
                               name.toLowerCase().contains("auth"))
                .sorted()
                .collect(Collectors.toList());
        return ResponseEntity.ok(securityBeans);
    }
    
    @GetMapping("/all-beans")
    public ResponseEntity<List<String>> getAllBeans() {
        String[] beanNames = applicationContext.getBeanDefinitionNames();
        return ResponseEntity.ok(Arrays.stream(beanNames).sorted().collect(Collectors.toList()));
    }
    
    @GetMapping("/status")
    public ResponseEntity<String> getStatus() {
        return ResponseEntity.ok("Debug controller is working! Spring context is loaded.");
    }
}