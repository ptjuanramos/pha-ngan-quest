package com.kpnquest.syncgamestate;

public record GameStateRequest(int completedCount, String stateJson) {}
