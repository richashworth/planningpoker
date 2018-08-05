package com.richashworth.planningpoker.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

/**
 * Created by Rich Ashworth on 20/08/2016.
 */
@RestController
@CrossOrigin
public class AppController {

    @Value("${feedback.recipient.email}")
    private String feedbackRecipient;

    @RequestMapping(value = "version", method = RequestMethod.GET, produces = "text/plain")
    @ResponseBody
    public String getAppVersion() {
        return "2.0.0-SNAPSHOT";
    }

    @RequestMapping(value = "feedbackRecipient", method = RequestMethod.GET, produces = "text/plain")
    @ResponseBody
    public String getFeedbackRecipient() {
        return feedbackRecipient;
    }
}
