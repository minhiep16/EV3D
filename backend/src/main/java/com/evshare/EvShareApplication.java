package com.evshare;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EvShareApplication {

    public static void main(String[] args) {
        SpringApplication.run(EvShareApplication.class, args);
    }
}
