package com.kpnquest.uploadphoto;

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
class UploadPhotoIT extends MssqlContainerExtension implements TestPropertyProvider {

    // Minimal valid base64 JPEG data-URL for tests
    private static final String STUB_DATA_URL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARC";

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
    void uploadPhoto_success() throws Exception {
        var body = Map.of("dataUrl", STUB_DATA_URL);

        var response = client.toBlocking().exchange(
            HttpRequest.POST("/api/v1/missions/1/photos", body).bearerAuth(jwt),
            String.class
        );

        JsonNode data = objectMapper.readTree(response.body()).path("data");
        assertThat(data.path("photoId").asLong()).isPositive();
        assertThat(data.path("missionId").asInt()).isEqualTo(1);
    }

    @Test
    void uploadPhoto_twice_upserts() throws Exception {
        // Use a fresh player to avoid state from other tests
        var identifyBody = Map.of("deviceToken", UUID.randomUUID().toString());
        String identifyJson = client.toBlocking().retrieve(HttpRequest.POST("/api/v1/players/identify", identifyBody));
        String freshJwt = objectMapper.readTree(identifyJson).path("data").path("token").asText();

        var body = Map.of("dataUrl", STUB_DATA_URL);
        var request1 = HttpRequest.POST("/api/v1/missions/3/photos", body).bearerAuth(freshJwt);
        var request2 = HttpRequest.POST("/api/v1/missions/3/photos", body).bearerAuth(freshJwt);

        String json1 = client.toBlocking().retrieve(request1);
        String json2 = client.toBlocking().retrieve(request2);

        long photoId1 = objectMapper.readTree(json1).path("data").path("photoId").asLong();
        long photoId2 = objectMapper.readTree(json2).path("data").path("photoId").asLong();

        // Upsert — same record updated, same ID returned
        assertThat(photoId1).isEqualTo(photoId2);
    }
}
