package com.example.portfolio;

import com.example.portfolio.config.JwtProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

import jakarta.annotation.PostConstruct;

@SpringBootApplication
@EnableCaching
@EnableScheduling
@EnableConfigurationProperties(JwtProperties.class)
public class PortfolioApplication {
    private static final Logger logger = LoggerFactory.getLogger(PortfolioApplication.class);

    public static void main(String[] args) {
        logger.info("Starting Portfolio Application...");
        SpringApplication.run(PortfolioApplication.class, args);
        logger.info("Portfolio Application started successfully");
    }
    
    @PostConstruct
    public void init() {
        logger.info("Portfolio Application initialized successfully");
    }
}
