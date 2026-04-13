package com.richashworth.planningpoker.model;

public record TimerState(
    boolean enabled,
    int durationSeconds,
    Long startedAt,
    Long pausedAt,
    long accumulatedPausedMs,
    long serverNow) {

  public static TimerState idle(boolean enabled, int durationSeconds) {
    return new TimerState(enabled, durationSeconds, null, null, 0L, System.currentTimeMillis());
  }
}
