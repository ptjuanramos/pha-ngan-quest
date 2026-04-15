package com.kpnquest.loadmissions;

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
import static org.assertj.core.api.Assertions.catchThrowableOfType;

@MicronautTest(transactional = false, environments = "test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class LoadMissionsIT extends MssqlContainerExtension implements TestPropertyProvider {

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
    void loadMissions_returnsAll8Missions() throws Exception {
        var response = client.toBlocking().exchange(
            HttpRequest.GET("/api/v1/missions").bearerAuth(jwt),
            String.class
        );

        JsonNode missions = objectMapper.readTree(response.body()).path("data");
        assertThat(missions.isArray()).isTrue();
        assertThat(missions.size()).isEqualTo(8);
    }

    @Test
    void loadMissions_missionHasExpectedFields() throws Exception {
        String json = client.toBlocking().retrieve(
            HttpRequest.GET("/api/v1/missions").bearerAuth(jwt)
        );

        JsonNode first = objectMapper.readTree(json).path("data").get(0);
        assertThat(first.path("id").asInt()).isEqualTo(1);
        assertThat(first.path("title").asText()).isNotBlank();
        assertThat(first.path("clue").asText()).isNotBlank();
        assertThat(first.path("isSpicy").asBoolean()).isFalse();
    }

    @Test
    void loadMissions_withoutToken_returns401() {
        var ex = catchThrowableOfType(
            () -> client.toBlocking().retrieve(HttpRequest.GET("/api/v1/missions")),
            io.micronaut.http.client.exceptions.HttpClientResponseException.class
        );
        assertThat(ex.getStatus().getCode()).isEqualTo(401);
    }
}
