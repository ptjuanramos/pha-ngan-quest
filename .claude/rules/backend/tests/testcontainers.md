---
paths:
  - "backend/src/test/**"
---

# Testcontainers — setup and Windows/Docker Desktop compatibility

## Goal

All integration tests run against a real MSSQL container via Testcontainers.
The setup must work on:
- Linux / macOS with Docker Engine or Docker Desktop
- Windows with Docker Desktop (WSL2 backend)

Never use H2 or any in-memory substitute.

## Dependencies (`build.gradle.kts`)

```kotlin
testImplementation("org.testcontainers:testcontainers:1.19.8")
testImplementation("org.testcontainers:mssqlserver:1.19.8")
testImplementation("org.testcontainers:junit-jupiter:1.19.8")
testImplementation("io.micronaut.test:micronaut-test-junit5")
```

## Shared container — reuse across tests

Define a single container so it starts once
per test run, not once per test class. Use Testcontainers' `@Container` +
`Lifecycle.PER_CLASS`, or a static field with `withReuse(true)`.

```java
// src/test/java/com/kpnquest/shared/MssqlContainerExtension.java
public class MssqlContainerExtension {

    public static final MSSQLServerContainer<?> CONTAINER =
        new MSSQLServerContainer<>("mcr.microsoft.com/mssql/server:2022-latest")
            .acceptLicense()
            .withReuse(true);  // requires ~/.testcontainers.properties: testcontainers.reuse.enable=true

    static {
        CONTAINER.start();
    }
}
```

Reference in integration tests:

```java
@MicronautTest
public class IdentifyPlayerIT extends MssqlContainerExtension {

    @TestPropertyProvider
    static Map<String, String> properties() {
        return Map.of(
            "datasources.default.url", CONTAINER.getJdbcUrl(),
            "datasources.default.username", CONTAINER.getUsername(),
            "datasources.default.password", CONTAINER.getPassword()
        );
    }
}
```

## Windows / Docker Desktop compatibility

### The socket problem on Windows

Testcontainers auto-detects the Docker socket. On Windows with Docker Desktop this
can fail because the socket path differs between WSL2 and the Windows host.

**Fix — add `testcontainers.properties` to the test resources:**

```properties
# src/test/resources/testcontainers.properties
docker.client.strategy=org.testcontainers.dockerclient.NpipeSocketClientProviderStrategy
```

This forces the named-pipe strategy (`//./pipe/docker_engine`) used by Docker Desktop
on Windows instead of the Unix socket strategy that fails in WSL2.

**Alternative for WSL2 users:** expose the Docker socket from WSL2:

```bash
# In WSL2 shell — add to ~/.bashrc or ~/.zshrc
export DOCKER_HOST=unix:///var/run/docker.sock
```

And ensure Docker Desktop → Settings → Resources → WSL Integration has your distro enabled.

### `withReuse(true)` on Windows

Container reuse requires a local properties file on the developer's machine
(not committed to the repo):

```properties
# ~/.testcontainers.properties  (create this file on each dev machine)
testcontainers.reuse.enable=true
```

Do NOT commit this file. Add a note in `README.md` telling developers to create it.
Without it, `withReuse(true)` is silently ignored and containers restart each run.

```yaml
env:
  DOCKER_HOST: npipe:////./pipe/docker_engine
```

## MSSQL-specific notes

- Always call `.acceptLicense()` — the container will not start without it
- Use image `mcr.microsoft.com/mssql/server:2022-latest` (free Developer edition)
- MSSQL is slow to start; set `.withStartupTimeout(Duration.ofSeconds(90))` as a minimum
- Flyway migrations run automatically on test startup via Micronaut's Flyway integration —
  no manual schema setup needed in tests