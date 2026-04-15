package com.kpnquest.completemission;

import com.kpnquest.shared.exception.ApiException;
import io.micronaut.http.HttpStatus;
import io.micronaut.transaction.annotation.Transactional;
import jakarta.inject.Singleton;

import java.time.LocalDateTime;

@Singleton
public class CompleteMissionService {

    private final CompletionRepository completionRepository;

    public CompleteMissionService(CompletionRepository completionRepository) {
        this.completionRepository = completionRepository;
    }

    @Transactional
    public CompleteMissionResponse complete(Long playerId, Integer missionId) {
        if (completionRepository.findByPlayerIdAndMissionId(playerId, missionId).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "ALREADY_COMPLETED",
                "Mission " + missionId + " is already completed");
        }

        LocalDateTime now = LocalDateTime.now();
        MissionCompletion completion = completionRepository.save(
            new MissionCompletion(null, playerId, missionId, now, now, now)
        );

        return new CompleteMissionResponse(completion.id(), missionId, completion.completedAt());
    }
}
