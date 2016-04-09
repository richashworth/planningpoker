package com.richashworth.planningpoker.model;

import org.springframework.stereotype.Component;

/**
 * Created by rich on 09/04/2016.
 */
@Component
public class SessionManager {
    public boolean isSessionLive(String id) {
        if ("2".equals(id)) {
            return true;
        }
        return false;
    }
}
