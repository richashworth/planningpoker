package com.richashworth.planningpoker.util;

import org.springframework.stereotype.Service;

@Service
public class Clock {

    static final long[] LATENCIES = new long[]{10L, 50L, 150L, 500L, 2000L, 5000L};

    public void pause(long latency) {
        try {
            Thread.sleep(latency);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

}
