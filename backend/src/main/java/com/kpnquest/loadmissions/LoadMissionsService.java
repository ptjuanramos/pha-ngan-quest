package com.kpnquest.loadmissions;

import jakarta.inject.Singleton;

import java.util.List;

@Singleton
public class LoadMissionsService {

    private final MissionRepository missionRepository;

    public LoadMissionsService(MissionRepository missionRepository) {
        this.missionRepository = missionRepository;
    }

    public List<MissionResponse> loadAll() {
        return missionRepository.findAllOrderById().stream()
            .map(MissionResponse::from)
            .toList();
    }
}
