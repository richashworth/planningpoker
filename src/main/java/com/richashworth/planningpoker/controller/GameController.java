package com.richashworth.planningpoker.controller;

import com.richashworth.planningpoker.service.SessionManager;
import com.richashworth.planningpoker.util.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import static com.richashworth.planningpoker.service.SessionManager.SESSION_SEQ_START_VALUE;

/**
 * Created by Rich Ashworth on 09/04/2016.
 */
@RestController
public class GameController {

    private final Logger logger = LoggerFactory.getLogger(getClass());
    private final SessionManager sessionManager;

    @Autowired
    private SimpMessagingTemplate template;

    @Autowired
    public GameController(SessionManager sessionManager) {
        this.sessionManager = sessionManager;
    }

    @RequestMapping(value = "joinSession", method = RequestMethod.POST)
    public void joinSession(
            @RequestParam(name = "sessionId") Long sessionId,
            @RequestParam(name = "userName") String userName
    ) {
        final String formattedUserName = StringUtils.formatUserName(userName);
        if (sessionId < SESSION_SEQ_START_VALUE || !sessionManager.isSessionActive(sessionId)) {
            throw new IllegalArgumentException("session not found");
        } else if (sessionManager.getUsers(sessionId).contains(formattedUserName)) {
            throw new IllegalArgumentException("user exists");
        } else {
            sessionManager.registerUser(formattedUserName, sessionId);
            logger.info(userName + " has joined session " + sessionId);
            template.convertAndSend("/topic/users/" + sessionId, sessionManager.getUsers(sessionId));
        }
    }

    @RequestMapping(value = "createSession", method = RequestMethod.POST)
    public long createSession(
            @RequestParam(name = "userName") String userName
    ) {
        final long sessionId = sessionManager.createSession();
        sessionManager.registerUser(userName, sessionId);
        logger.info(userName + " has created session " + sessionId);
        return sessionId;
    }

    @RequestMapping(value = "reset", method = RequestMethod.DELETE)
    public void reset(
            @RequestParam(name = "sessionId") Long sessionId,
            @RequestParam(name = "userName") String userName
    ) {
        logger.info(userName + " has reset session " + sessionId);
        sessionManager.resetSession(sessionId);
        template.convertAndSend("/topic/results/" + sessionId, sessionManager.getResults(sessionId));
    }

}
