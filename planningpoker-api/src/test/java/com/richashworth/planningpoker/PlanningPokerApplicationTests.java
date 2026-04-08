package com.richashworth.planningpoker;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest(classes = PlanningPokerApplication.class)
@ActiveProfiles("test")
@TestPropertySource(
    properties = {
      "spring.main.allow-bean-definition-overriding=true",
      "spring.main.banner-mode=off"
    })
class PlanningPokerApplicationTests {

  @Test
  void contextLoads() {}
}
