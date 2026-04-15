package com.kpnquest.completemission;

import java.time.LocalDateTime;

public record CompleteMissionResponse(Long completionId, int missionId, LocalDateTime completedAt) {}
