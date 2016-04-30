package com.richashworth.planningpoker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.socket.config.annotation.EnableWebSocket;

@SpringBootApplication
@EnableScheduling
public class PlanningPokerApplication {

    public static void main(String[] args) {
        SpringApplication.run(PlanningPokerApplication.class, args);
    }
}
