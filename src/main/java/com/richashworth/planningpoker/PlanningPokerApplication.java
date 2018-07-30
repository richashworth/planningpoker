package com.richashworth.planningpoker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.bind.annotation.CrossOrigin;

@SpringBootApplication
@CrossOrigin(origins = "http://localhost:3000")
@EnableScheduling
public class PlanningPokerApplication {

    public static void main(String[] args) {
        SpringApplication.run(PlanningPokerApplication.class, args);
    }
}
