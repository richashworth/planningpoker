package com.richashworth.planningpoker.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class ClockTest {

    private final Clock clock = new Clock();

    @Test
    void testPause() {
        assertDoesNotThrow(() -> clock.pause(1L));
    }

}
