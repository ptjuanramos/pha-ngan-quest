package com.kpnquest.loadmissions;

public record MissionResponse(
    int id,
    String title,
    String clue,
    String locationHint,
    String challenge,
    boolean isSpicy
) {
    public static MissionResponse from(Mission mission) {
        return new MissionResponse(
            mission.id(),
            mission.title(),
            mission.clue(),
            mission.locationHint(),
            mission.challenge(),
            mission.isSpicy()
        );
    }
}
