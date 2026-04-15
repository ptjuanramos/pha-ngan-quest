package com.kpnquest.identifyplayer;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kpnquest.shared.MssqlContainerExtension;
import io.micronaut.http.HttpRequest;
import io.micronaut.http.client.HttpClient;
import io.micronaut.http.client.annotation.Client;
import io.micronaut.test.extensions.junit5.annotation.MicronautTest;
import io.micronaut.test.support.TestPropertyProvider;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@MicronautTest(transactional = false, environments = "test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class IdentifyPlayerIT extends MssqlContainerExtension implements TestPropertyProvider {

    @Inject @Client("/") HttpClient client;
    @Inject ObjectMapper objectMapper;

    @Override
    public Map<String, String> getProperties() {
        return datasourceProperties();
    }

    @Test
    void newDevice_createsPlayerAndReturnsToken() throws Exception {
        var body = Map.of("deviceToken", UUID.randomUUID().toString());

        var response = client.toBlocking().exchange(
            HttpRequest.POST("/api/v1/players/identify", body),
            String.class
        );

        JsonNode data = objectMapper.readTree(response.body()).path("data");
        assertThat(data.path("playerId").asLong()).isPositive();
        assertThat(data.path("token").asText()).isNotBlank();
    }

    @Test
    void sameDevice_returnsSamePlayerId() throws Exception {
        String deviceToken = UUID.randomUUID().toString();
        var body = Map.of("deviceToken", deviceToken);

        String json1 = client.toBlocking().retrieve(HttpRequest.POST("/api/v1/players/identify", body));
        String json2 = client.toBlocking().retrieve(HttpRequest.POST("/api/v1/players/identify", body));

        long id1 = objectMapper.readTree(json1).path("data").path("playerId").asLong();
        long id2 = objectMapper.readTree(json2).path("data").path("playerId").asLong();

        assertThat(id1).isEqualTo(id2);
    }
}
