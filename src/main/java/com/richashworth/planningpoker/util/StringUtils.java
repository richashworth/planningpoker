package com.richashworth.planningpoker.util;

import org.apache.commons.lang3.text.WordUtils;

/**
 * Created by Rich Ashworth on 16/04/2016.
 */
public class StringUtils {
    public static String formatUserName(String userName) {
        return userName.length() > 2 ? WordUtils.capitalizeFully(userName) : userName.toUpperCase();
    }
}
