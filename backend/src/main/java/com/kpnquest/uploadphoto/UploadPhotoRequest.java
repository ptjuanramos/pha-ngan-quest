package com.kpnquest.uploadphoto;

import jakarta.validation.constraints.NotBlank;

public record UploadPhotoRequest(@NotBlank String dataUrl) {}
