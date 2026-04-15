package com.kpnquest.syncgamestate;

import io.micronaut.transaction.annotation.Transactional;
import jakarta.inject.Singleton;

import java.time.LocalDateTime;

@Singleton
public class SyncGameStateService {

    private final GameStateRepository gameStateRepository;

    public SyncGameStateService(GameStateRepository gameStateRepository) {
        this.gameStateRepository = gameStateRepository;
    }

    public GameStateResponse get(Long playerId) {
        return gameStateRepository.findByPlayerId(playerId)
            .map(this::toResponse)
            .orElse(new GameStateResponse(null, playerId, 0, "{}", null));
    }

    @Transactional
    public GameStateResponse save(Long playerId, GameStateRequest request) {
        LocalDateTime now = LocalDateTime.now();

        GameState state = gameStateRepository.findByPlayerId(playerId)
            .map(existing -> gameStateRepository.update(
                new GameState(existing.id(), playerId, request.completedCount(), request.stateJson(), existing.createdAt(), now)
            ))
            .orElseGet(() -> gameStateRepository.save(
                new GameState(null, playerId, request.completedCount(), request.stateJson(), now, now)
            ));

        return toResponse(state);
    }

    private GameStateResponse toResponse(GameState state) {
        return new GameStateResponse(
            state.id(), state.playerId(), state.completedCount(), state.stateJson(), state.updatedAt()
        );
    }
}
