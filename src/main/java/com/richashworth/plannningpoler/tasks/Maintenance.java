package com.richashworth.plannningpoler.tasks;

import com.richashworth.planningpoker.model.SessionManager;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Created by rich on 10/04/2016.
 */
@Component
public class Maintenance {
    private SessionManager sessionManager;

    public Maintenance(SessionManager sessionManager) {
        this.sessionManager = sessionManager;
    }

    @Scheduled(cron = "0 0 * * Sun")
    public void resetSessions() {
        sessionManager.clearSessions();
    }
}
