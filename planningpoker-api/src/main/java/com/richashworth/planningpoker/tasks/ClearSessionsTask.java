package com.richashworth.planningpoker.tasks;

import com.richashworth.planningpoker.service.SessionManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ClearSessionsTask {

    private final SessionManager sessionManager;

    @Autowired
    public ClearSessionsTask(SessionManager sessionManager) {
        this.sessionManager = sessionManager;
    }

    @Scheduled(cron = "0 0 0 * * Sun")
    public void clearSessions() {
        sessionManager.clearSessions();
    }
}
