package com.kpnquest.completemission;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kpnquest.shared.MssqlContainerExtension;
import io.micronaut.http.HttpRequest;
import io.micronaut.http.client.HttpClient;
import io.micronaut.http.client.annotation.Client;
import io.micronaut.http.client.exceptions.HttpClientResponseException;
import io.micronaut.test.extensions.junit5.annotation.MicronautTest;
import io.micronaut.test.support.TestPropertyProvider;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

@MicronautTest(transactional = false, environments = "test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class CompleteMissionIT extends MssqlContainerExtension implements TestPropertyProvider {

    @Inject @Client("/") HttpClient client;
    @Inject ObjectMapper objectMapper;

    private String jwt;

    @Override
    public Map<String, String> getProperties() {
        return datasourceProperties();
    }

    @BeforeAll
    void authenticate() throws Exception {
        var body = Map.of("deviceToken", UUID.randomUUID().toString());
        String json = client.toBlocking().retrieve(HttpRequest.POST("/api/v1/players/identify", body));
        jwt = objectMapper.readTree(json).path("data").path("token").asText();
    }

    @Test
    void completeMission_success() throws Exception {
        var body = Map.of("photoId", 1);

        var response = client.toBlocking().exchange(
            HttpRequest.POST("/api/v1/missions/1/complete", body).bearerAuth(jwt),
            String.class
        );

        JsonNode data = objectMapper.readTree(response.body()).path("data");
        assertThat(data.path("completionId").asLong()).isPositive();
        assertThat(data.path("missionId").asInt()).isEqualTo(1);
    }

    @Test
    void completeMission_alreadyCompleted_returns409() throws Exception {
        // Use a fresh player so the mission is not already completed
        var identifyBody = Map.of("deviceToken", UUID.randomUUID().toString());
        String identifyJson = client.toBlocking().retrieve(HttpRequest.POST("/api/v1/players/identify", identifyBody));
        String freshJwt = objectMapper.readTree(identifyJson).path("data").path("token").asText();

        var body = Map.of("photoId", 1);
        var request = HttpRequest.POST("/api/v1/missions/2/complete", body).bearerAuth(freshJwt);

        client.toBlocking().retrieve(request);

        var ex = catchThrowableOfType(
            () -> client.toBlocking().retrieve(HttpRequest.POST("/api/v1/missions/2/complete", body).bearerAuth(freshJwt)),
            HttpClientResponseException.class
        );

        assertThat(ex.getStatus().getCode()).isEqualTo(409);
    }
}
