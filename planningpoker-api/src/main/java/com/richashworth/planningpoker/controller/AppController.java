package com.richashworth.planningpoker.controller;

import com.richashworth.planningpoker.PlanningPokerApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AppController {

  /**
   * Returns the running application version from the JAR manifest, or {@code "dev"} when running
   * from IDE/local build without a populated manifest.
   */
  @GetMapping(value = "version", produces = "text/plain")
  public String getAppVersion() {
    String version = PlanningPokerApplication.class.getPackage().getImplementationVersion();
    return version != null ? version : "dev";
  }
}
