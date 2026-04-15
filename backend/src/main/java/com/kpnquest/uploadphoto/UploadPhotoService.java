package com.kpnquest.uploadphoto;

import io.micronaut.transaction.annotation.Transactional;
import jakarta.inject.Singleton;

import java.time.LocalDateTime;

@Singleton
public class UploadPhotoService {

    private final PhotoRepository photoRepository;

    public UploadPhotoService(PhotoRepository photoRepository) {
        this.photoRepository = photoRepository;
    }

    @Transactional
    public UploadPhotoResponse upload(Long playerId, Integer missionId, String dataUrl) {
        LocalDateTime now = LocalDateTime.now();

        Photo photo = photoRepository.findByPlayerIdAndMissionId(playerId, missionId)
            .map(existing -> photoRepository.update(
                new Photo(existing.id(), existing.playerId(), existing.missionId(), dataUrl, existing.createdAt(), now)
            ))
            .orElseGet(() -> photoRepository.save(
                new Photo(null, playerId, missionId, dataUrl, now, now)
            ));

        return new UploadPhotoResponse(photo.id(), missionId);
    }
}
