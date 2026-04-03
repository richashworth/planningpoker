package com.richashworth.planningpoker.tasks;

import com.richashworth.planningpoker.service.SessionManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClearSessionsTaskTest {

    @InjectMocks
    private ClearSessionsTask clearSessionsTask;

    @Spy
    private SessionManager sessionManager;

    @Test
    void testClearSessions() {
        clearSessionsTask.clearSessions();
        verify(sessionManager, times(1)).clearSessions();
        verifyNoMoreInteractions(sessionManager);
    }

}
