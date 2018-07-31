package com.richashworth.planningpoker.controller;

import com.google.common.collect.Multimaps;
import com.richashworth.planningpoker.service.SessionManager;
import com.richashworth.planningpoker.util.MessagingUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import static com.richashworth.planningpoker.service.SessionManager.SESSION_SEQ_START_VALUE;
import static com.richashworth.planningpoker.util.CollectionUtils.containsIgnoreCase;

/**
 * Created by Rich Ashworth on 09/04/2016.
 */
@RestController
@CrossOrigin
public class GameController {

    private final Logger logger = LoggerFactory.getLogger(getClass());
    private final SessionManager sessionManager;
    private final MessagingUtils messagingUtils;

    @Autowired
    public GameController(SessionManager sessionManager, MessagingUtils messagingUtils) {
        this.sessionManager = sessionManager;
        this.messagingUtils = messagingUtils;
    }

    @RequestMapping(value = "joinSession", method = RequestMethod.POST)
    public void joinSession(
            @RequestParam(name = "sessionId") final Long sessionId,
            @RequestParam(name = "userName") final String userName
    ) {
        if (sessionId < SESSION_SEQ_START_VALUE || !sessionManager.isSessionActive(sessionId)) {
            throw new IllegalArgumentException("session not found");
        } else if (containsIgnoreCase(sessionManager.getSessionUsers(sessionId), userName)) {
            throw new IllegalArgumentException("user exists");
        } else {
            sessionManager.registerUser(userName, sessionId);
            logger.info(userName + " has joined session " + sessionId);
            messagingUtils.burstUsersMessages(sessionId);
            messagingUtils.burstItemMessages(sessionId);
        }
    }

    @RequestMapping(value = "createSession", method = RequestMethod.POST)
    public long createSession(
            @RequestParam(name = "userName") final String userName
    ) {
        final long sessionId = sessionManager.createSession();
        sessionManager.registerUser(userName, sessionId);
        logger.info(userName + " has created session " + sessionId);
        messagingUtils.burstUsersMessages(sessionId);
        return sessionId;
    }

    @RequestMapping(value = "refresh", method = RequestMethod.GET)
    public void refresh(
            @RequestParam(name = "sessionId") final Long sessionId
    ) {
        messagingUtils.sendResultsMessage(sessionId);
        messagingUtils.sendUsersMessage(sessionId);
        messagingUtils.sendItemMessage(sessionId);
    }

    @RequestMapping(value = "sessionUsers", method = RequestMethod.GET)
    public List<String> getSessionUsers(
            @RequestParam(name = "sessionId") final Long sessionId
    ) {
        return sessionManager.getSessionUsers(sessionId);
    }

    @RequestMapping(value = "sessions", method = RequestMethod.GET)
    @ResponseBody
    public Map<Long, List<String>> getSessions() {
        return Multimaps.asMap(sessionManager.getSessions());
    }

    @RequestMapping(value = "setCurrentItem", method = RequestMethod.POST)
    public void setCurrentItem(
            @RequestParam(name = "sessionId") final Long sessionId,
            @RequestParam(name = "item") final String item
    ) {
        sessionManager.setCurrentItem(sessionId, item);
        messagingUtils.burstItemMessages(sessionId);
    }

    @RequestMapping(value = "reset", method = RequestMethod.DELETE)
    public void reset(
            @RequestParam(name = "sessionId") final Long sessionId,
            @RequestParam(name = "userName") final String userName
    ) {
        logger.info(userName + " has reset session " + sessionId);
        synchronized (sessionManager) {
            sessionManager.resetSession(sessionId);
            messagingUtils.burstResultsMessages(sessionId);
            messagingUtils.burstItemMessages(sessionId);
        }
    }

}
