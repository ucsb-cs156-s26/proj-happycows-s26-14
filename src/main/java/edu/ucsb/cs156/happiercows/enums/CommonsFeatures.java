package edu.ucsb.cs156.happiercows.enums;

import java.util.Arrays;

public enum CommonsFeatures {
    FARMERS_CAN_SEE_LEADERBOARD,
    SHOW_CHAT;

    public static boolean isValidFeature(String featureName) {
        return Arrays.stream(values())
                .anyMatch(feature -> feature.name().equals(featureName));
    }
}
