package com.richashworth.planningpoker.util;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.InjectMocks;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

@RunWith(PowerMockRunner.class)
@PrepareForTest(Clock.class)
public class ClockTest {

    @InjectMocks
    private Clock clock;

    @Test
    public void testPause() throws InterruptedException {
        PowerMockito.mockStatic(Thread.class);
        PowerMockito.doNothing().when(Thread.class);
        clock.pause(10000L);
        PowerMockito.verifyStatic();
    }

}
