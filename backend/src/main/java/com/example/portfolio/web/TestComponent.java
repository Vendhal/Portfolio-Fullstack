package com.example.portfolio.web;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class TestComponent {
    private static final Logger logger = LoggerFactory.getLogger(TestComponent.class);
    
    public TestComponent() {
        logger.error("====== TEST COMPONENT CONSTRUCTOR CALLED ======");
        System.out.println("====== TEST COMPONENT CONSTRUCTOR CALLED (SYSOUT) ======");
        System.err.println("====== TEST COMPONENT CONSTRUCTOR CALLED (SYSERR) ======");
    }
}