package com.example.portfolio.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TestConfig {
    private static final Logger logger = LoggerFactory.getLogger(TestConfig.class);
    
    public TestConfig() {
        logger.error("====== TEST CONFIG CONSTRUCTOR CALLED ======");
        System.out.println("====== TEST CONFIG CONSTRUCTOR CALLED (SYSOUT) ======");
        System.err.println("====== TEST CONFIG CONSTRUCTOR CALLED (SYSERR) ======");
    }
}