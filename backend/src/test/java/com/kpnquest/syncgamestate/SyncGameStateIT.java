package com.kpnquest.syncgamestate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kpnquest.shared.MssqlContainerExtension;
import io.micronaut.http.HttpRequest;
import io.micronaut.http.client.HttpClient;
import io.micronaut.http.client.annotation.Client;
import io.micronaut.test.extensions.junit5.annotation.MicronautTest;
import io.micronaut.test.support.TestPropertyProvider;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@MicronautTest(transactional = false, environments = "test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class SyncGameStateIT extends MssqlContainerExtension implements TestPropertyProvider {

    @Inject @Client("/") HttpClient client;
    @Inject ObjectMapper objectMapper;

    private String jwt;
    private long playerId;

    @Override
    public Map<String, String> getProperties() {
        return datasourceProperties();
    }

    @BeforeAll
    void authenticate() throws Exception {
        var body = Map.of("deviceToken", UUID.randomUUID().toString());
        String json = client.toBlocking().retrieve(HttpRequest.POST("/api/v1/players/identify", body));
        JsonNode data = objectMapper.readTree(json).path("data");
        jwt = data.path("token").asText();
        playerId = data.path("playerId").asLong();
    }

    @Test
    void getState_newPlayer_returnsDefaultState() throws Exception {
        var response = client.toBlocking().exchange(
            HttpRequest.GET("/api/v1/players/" + playerId + "/state").bearerAuth(jwt),
            String.class
        );

        JsonNode data = objectMapper.readTree(response.body()).path("data");
        assertThat(data.path("completedCount").asInt()).isEqualTo(0);
    }

    @Test
    void putAndGetState_persistsState() throws Exception {
        // Use a fresh player to avoid cross-test interference
        var identifyBody = Map.of("deviceToken", UUID.randomUUID().toString());
        String identifyJson = client.toBlocking().retrieve(HttpRequest.POST("/api/v1/players/identify", identifyBody));
        JsonNode identifyData = objectMapper.readTree(identifyJson).path("data");
        String freshJwt = identifyData.path("token").asText();
        long freshPlayerId = identifyData.path("playerId").asLong();

        var putBody = Map.of("completedCount", 3, "stateJson", "{\"started\":true}");
        client.toBlocking().exchange(
            HttpRequest.PUT("/api/v1/players/" + freshPlayerId + "/state", putBody).bearerAuth(freshJwt),
            String.class
        );

        String getJson = client.toBlocking().retrieve(
            HttpRequest.GET("/api/v1/players/" + freshPlayerId + "/state").bearerAuth(freshJwt)
        );

        JsonNode data = objectMapper.readTree(getJson).path("data");
        assertThat(data.path("completedCount").asInt()).isEqualTo(3);
        assertThat(data.path("stateJson").asText()).isEqualTo("{\"started\":true}");
    }
}
