package com.richashworth.planningpoker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ImportRuntimeHints;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@ImportRuntimeHints(NativeRuntimeHints.class)
public class PlanningPokerApplication {

  public static void main(String[] args) {
    SpringApplication.run(PlanningPokerApplication.class, args);
  }
}
