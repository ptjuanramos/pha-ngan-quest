package com.kpnquest.shared;

import org.testcontainers.containers.MSSQLServerContainer;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.time.Duration;
import java.util.Map;

public class MssqlContainerExtension {

    public static final MSSQLServerContainer<?> CONTAINER =
        new MSSQLServerContainer<>("mcr.microsoft.com/mssql/server:2022-latest")
            .acceptLicense()
            .withStartupTimeout(Duration.ofSeconds(90))
            .withReuse(true);

    static {
        CONTAINER.start();
        createDatabase();

        String url = jdbcUrl();
        System.setProperty("datasources.default.url", url);
        System.setProperty("datasources.default.username", CONTAINER.getUsername());
        System.setProperty("datasources.default.password", CONTAINER.getPassword());
        System.setProperty("datasources.default.driver-class-name", "com.microsoft.sqlserver.jdbc.SQLServerDriver");
    }

    private static void createDatabase() {
        String masterUrl = CONTAINER.getJdbcUrl();
        try (Connection conn = DriverManager.getConnection(masterUrl, CONTAINER.getUsername(), CONTAINER.getPassword());
             Statement stmt = conn.createStatement()) {
            stmt.execute("IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'kpnquest') CREATE DATABASE kpnquest");
        } catch (Exception e) {
            throw new RuntimeException("Failed to create kpnquest database", e);
        }
    }

    protected static Map<String, String> datasourceProperties() {
        return Map.of(
            "datasources.default.url",               jdbcUrl(),
            "datasources.default.username",          CONTAINER.getUsername(),
            "datasources.default.password",          CONTAINER.getPassword(),
            "datasources.default.driver-class-name", "com.microsoft.sqlserver.jdbc.SQLServerDriver"
        );
    }

    private static String jdbcUrl() {
        return "jdbc:sqlserver://" + CONTAINER.getHost() + ":" + CONTAINER.getMappedPort(1433)
            + ";databaseName=kpnquest;encrypt=false;trustServerCertificate=true";
    }
}
