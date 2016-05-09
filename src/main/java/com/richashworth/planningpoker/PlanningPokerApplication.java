package com.richashworth.planningpoker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.task.SimpleAsyncTaskExecutor;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.concurrent.Executor;

@SpringBootApplication
@EnableScheduling
public class PlanningPokerApplication {

    public static void main(String[] args) {
        SpringApplication.run(PlanningPokerApplication.class, args);
    }
}
