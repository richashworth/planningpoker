package com.richashworth.planningpoker.tasks;

import com.richashworth.planningpoker.service.SessionManager;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import org.mockito.runners.MockitoJUnitRunner;

import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

/**
 * Created by Rich Ashworth on 14/08/2016.
 */
@RunWith(MockitoJUnitRunner.class)
public class ClearSessionsTaskTest {

    @InjectMocks
    private ClearSessionsTask clearSessionsTask;

    @Spy
    private SessionManager sessionManager;

    @Test
    public void testClearSessions() throws Exception {
        clearSessionsTask.clearSessions();
        verify(sessionManager, times(1)).clearSessions();
    }

}