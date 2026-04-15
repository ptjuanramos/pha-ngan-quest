package com.kpnquest.identifyplayer;

import io.micronaut.security.authentication.Authentication;
import io.micronaut.security.token.generator.TokenGenerator;
import jakarta.inject.Singleton;

import java.time.LocalDateTime;
import java.util.Optional;

@Singleton
public class IdentifyPlayerService {

    private static final int TOKEN_EXPIRY_SECONDS = 60 * 60 * 24 * 90; // 90 days

    private final PlayerRepository playerRepository;
    private final TokenGenerator tokenGenerator;

    public IdentifyPlayerService(PlayerRepository playerRepository, TokenGenerator tokenGenerator) {
        this.playerRepository = playerRepository;
        this.tokenGenerator = tokenGenerator;
    }

    public IdentifyPlayerResponse identify(IdentifyPlayerRequest request) {
        Player player = playerRepository.findByDeviceToken(request.deviceToken())
            .orElseGet(() -> {
                LocalDateTime now = LocalDateTime.now();
                return playerRepository.save(new Player(null, request.deviceToken(), now, now));
            });

        Authentication auth = Authentication.build(String.valueOf(player.id()));
        Optional<String> token = tokenGenerator.generateToken(auth, TOKEN_EXPIRY_SECONDS);

        return new IdentifyPlayerResponse(
            player.id(),
            token.orElseThrow(() -> new IllegalStateException("Failed to generate JWT"))
        );
    }
}
