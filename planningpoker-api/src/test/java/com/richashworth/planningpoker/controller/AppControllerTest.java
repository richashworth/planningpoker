package com.richashworth.planningpoker.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class AppControllerTest {

  private final AppController appController = new AppController();

  @Test
  void testGetAppVersionReturnsDevWhenNoManifest() {
    String version = appController.getAppVersion();
    assertEquals("dev", version);
  }
}
