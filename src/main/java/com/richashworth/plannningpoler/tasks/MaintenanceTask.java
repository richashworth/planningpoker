package com.richashworth.plannningpoler.tasks;

import com.richashworth.planningpoker.model.SessionManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Created by rich on 10/04/2016.
 */
@Component
public class MaintenanceTask {

    private SessionManager sessionManager;

    @Autowired
    public MaintenanceTask(SessionManager sessionManager) {
        this.sessionManager = sessionManager;
    }

    @Scheduled(cron = "0 0 * * *")
    public void resetSessions() {
        sessionManager.clearSessions();
    }
}
