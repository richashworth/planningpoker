package com.richashworth.planningpoker.controller;

import com.richashworth.planningpoker.PlanningPokerApplication;
import org.springframework.web.bind.annotation.*;

/**
 * Created by Rich Ashworth on 20/08/2016.
 */
@RestController
@CrossOrigin
public class AppController {

    @RequestMapping(value = "version", method = RequestMethod.GET, produces = "text/plain")
    @ResponseBody
    public String getAppVersion() {
        return PlanningPokerApplication.class.getPackage().getImplementationVersion();
    }

}
