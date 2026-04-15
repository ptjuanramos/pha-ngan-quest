package com.kpnquest.shared.exception;

import com.kpnquest.shared.web.ApiResponse;
import com.kpnquest.shared.web.ErrorBody;
import io.micronaut.http.HttpRequest;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.annotation.Produces;
import io.micronaut.http.server.exceptions.ExceptionHandler;
import jakarta.inject.Singleton;

@Singleton
@Produces
public class GlobalExceptionHandler implements ExceptionHandler<ApiException, HttpResponse<ApiResponse<Void>>> {

    @Override
    public HttpResponse<ApiResponse<Void>> handle(HttpRequest request, ApiException exception) {
        return HttpResponse.<ApiResponse<Void>>status(exception.status())
            .body(ApiResponse.error(new ErrorBody(exception.code(), exception.getMessage())));
    }
}
