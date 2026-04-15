package com.kpnquest.shared.web;

public record ApiResponse<T>(T data, ErrorBody error) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(data, null);
    }

    public static <T> ApiResponse<T> error(ErrorBody error) {
        return new ApiResponse<>(null, error);
    }
}
