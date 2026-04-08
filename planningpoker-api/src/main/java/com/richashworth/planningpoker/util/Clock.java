package com.richashworth.planningpoker.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class Clock {

  private static final Logger logger = LoggerFactory.getLogger(Clock.class);

  static final long[] LATENCIES = new long[] {10L, 50L, 150L, 500L, 2000L};

  public void pause(long latency) {
    try {
      Thread.sleep(latency);
    } catch (InterruptedException e) {
      logger.warn("Sleep interrupted during pause of {}ms", latency, e);
      Thread.currentThread().interrupt();
    }
  }
}
