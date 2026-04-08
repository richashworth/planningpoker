package com.richashworth.planningpoker.tasks;

import static org.mockito.Mockito.*;

import com.richashworth.planningpoker.service.SessionManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ClearSessionsTaskTest {

  @InjectMocks private ClearSessionsTask clearSessionsTask;

  @Spy private SessionManager sessionManager;

  @Test
  void testClearSessions() {
    clearSessionsTask.clearSessions();
    verify(sessionManager, times(1)).clearSessions();
    verifyNoMoreInteractions(sessionManager);
  }

  @Test
  void testEvictIdleSessions() {
    clearSessionsTask.evictIdleSessions();
    verify(sessionManager, times(1)).evictIdleSessions();
    verifyNoMoreInteractions(sessionManager);
  }
}
