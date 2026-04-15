package com.kpnquest.identifyplayer;

import jakarta.validation.constraints.NotBlank;

public record IdentifyPlayerRequest(@NotBlank String deviceToken) {}
