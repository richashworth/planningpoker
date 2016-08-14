package com.richashworth.planningpoker.util;

import org.springframework.stereotype.Service;

/**
 * Created by Rich Ashworth on 14/08/2016.
 */
@Service
public class Clock {

    static final long[] LATENCIES = new long[]{0L, 50L, 100L, 500L, 1000L, 2000L, 5000L, 10000L};

    public void pause(long latency) {
        try {
            Thread.sleep(latency);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

}
