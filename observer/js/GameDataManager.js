class GameDataManager {
    constructor(observer) {
        this.observer = observer;
        this.gameStates = [];
        this.currentFrame = 0;
        this.selectedEntity = null;
        this.interpolationEnabled = true;
        this.interpolationProgress = 0;
        this.targetFrame = 0;
        this.lastFrameTime = 0;
    }

    async loadGameData() {
        // Just initialize with empty state - data will be loaded via file upload
        this.gameStates = [];
        this.currentFrame = 0;
        this.selectedEntity = null;
        this.interpolationProgress = 0;
        this.targetFrame = 0;

        console.log('GameDataManager initialized - waiting for file upload');
    }

    // Method to load data from uploaded file
    async loadUploadedData(gameStates) {
        this.gameStates = gameStates;
        this.currentFrame = 0;
        this.selectedEntity = null;
        this.interpolationProgress = 0;
        this.targetFrame = 0;

        console.log(`Loaded ${this.gameStates.length} game states from uploaded file`);

        this.updatePlayerInfo();
        this.updatePlayerColors();
        this.resetView();
        this.updateTimelineUI();

        // Notify timeline manager that data is loaded
        if (this.observer && this.observer.timelineManager) {
            this.observer.timelineManager.onDataLoaded();
        }
    }

    getCurrentFrame() {
        return this.currentFrame;
    }

    setCurrentFrame(frame) {
        if (frame >= 0 && frame < this.gameStates.length) {
            this.currentFrame = frame;
            this.updatePlayerInfo();
            this.updatePlayerColors();
            this.updateTimelineUI();
            this.updateEntityInfo(); // Update selected entity info when frame changes
            // Update play button state when frame changes
            if (this.observer.timelineManager) {
                this.observer.timelineManager.updatePlayButtonState();
            }
        }
    }

    getTotalFrames() {
        return this.gameStates.length;
    }

    getCurrentGameData() {
        return this.gameStates[this.currentFrame] || null;
    }

    nextFrame() {
        if (this.currentFrame < this.gameStates.length - 1) {
            this.setCurrentFrame(this.currentFrame + 1);
            return true;
        }
        return false;
    }

    previousFrame() {
        if (this.currentFrame > 0) {
            this.setCurrentFrame(this.currentFrame - 1);
            return true;
        }
        return false;
    }

    updateTimelineUI() {
        const frameSlider = document.getElementById('frameSlider');
        const frameCounter = document.getElementById('frameCounter');

        if (frameSlider && this.gameStates.length > 0) {
            frameSlider.max = this.gameStates.length - 1;
            frameSlider.value = this.currentFrame;
        }

        if (frameCounter) {
            frameCounter.textContent = `${this.currentFrame + 1} / ${this.gameStates.length}`;
        }
    }

    updatePlayerInfo() {
        const currentGameData = this.getCurrentGameData();
        if (!currentGameData) return;

        currentGameData.players.forEach(player => {
            const playerNum = player.id + 1;

            // Update player header with name and ID
            const headerElement = document.getElementById(`p${playerNum}Header`);
            if (headerElement) {
                headerElement.textContent = `${player.name} (${player.id})`;
            }

            // Update rock and fuel
            document.getElementById(`p${playerNum}Rock`).textContent = player.rock;
            document.getElementById(`p${playerNum}Fuel`).textContent = player.fuel;

            // Count ships for this player
            const playerShips = currentGameData.ships.filter(s => s.player === player.id);
            document.getElementById(`p${playerNum}Ships`).textContent = playerShips.length;
        });
    }

    getPlayerColor(playerId) {
        const currentGameData = this.getCurrentGameData();
        if (!currentGameData || !currentGameData.players) return '#ffffff';
        const player = currentGameData.players.find(p => p.id === playerId);
        return player ? player.color : '#ffffff';
    }

    updatePlayerColors() {
        const currentGameData = this.getCurrentGameData();
        if (!currentGameData) return;

        currentGameData.players.forEach(player => {
            const playerNum = player.id + 1;
            const playerInfo = document.getElementById(`player${playerNum}Info`);
            if (playerInfo) {
                playerInfo.style.borderLeftColor = player.color || '#ffffff';
            }
        });
    }

    selectEntityAt(x, y) {
        const currentGameData = this.getCurrentGameData();
        if (!currentGameData) return;

        this.selectedEntity = null;

        for (const ship of currentGameData.ships) {
            if (ship === null) continue;
            const dist = Math.sqrt((ship.position.x - x) ** 2 + (ship.position.y - y) ** 2);
            if (dist < 50) {
                this.selectedEntity = { type: 'ship', id: ship.id };
                break;
            }
        }

        if (!this.selectedEntity) {
            for (const asteroid of currentGameData.asteroids) {
                if (asteroid === null) continue;
                const dist = Math.sqrt((asteroid.position.x - x) ** 2 + (asteroid.position.y - y) ** 2);
                if (dist < asteroid.size + 10) {
                    this.selectedEntity = { type: 'asteroid', id: asteroid.id };
                    break;
                }
            }
        }

        if (!this.selectedEntity) {
            for (const wormhole of currentGameData.wormholes) {
                if (wormhole === null) continue;
                const dist = Math.sqrt((wormhole.position.x - x) ** 2 + (wormhole.position.y - y) ** 2);
                if (dist < 30) {
                    this.selectedEntity = { type: 'wormhole', id: wormhole.id };
                    break;
                }
            }
        }

        this.updateEntityInfo();
    }

    updateEntityInfo() {
        const infoDiv = document.getElementById('entityInfo');

        if (!this.selectedEntity) {
            infoDiv.innerHTML = '<strong>Click on an entity to see details</strong>';
            return;
        }

        const selectedData = this.getInterpolatedSelectedEntity();
        if (!selectedData) {
            infoDiv.innerHTML = '<strong>Selected entity not found in current frame</strong>';
            return;
        }

        const { type, data } = selectedData;
        let html = `<strong>${type.charAt(0).toUpperCase() + type.slice(1)} ID: ${data.id}</strong> `;

        switch (type) {
            case 'ship':
                html += `<span class="entity-detail">P${data.player + 1}</span>`;
                html += `<span class="entity-detail">Pos: (${Math.round(data.position.x)}, ${Math.round(data.position.y)})</span>`;
                html += `<span class="entity-detail">HP: ${data.health}</span>`;
                html += `<span class="entity-detail">Fuel: ${data.fuel}</span>`;
                html += `<span class="entity-detail">Type: ${data.type}</span>`;
                html += `<span class="entity-detail">Cargo: ${data.cargo}</span>`;
                break;
            case 'asteroid':
                html += `<span class="entity-detail">Pos: (${Math.round(data.position.x)}, ${Math.round(data.position.y)})</span>`;
                html += `<span class="entity-detail">Size: ${data.size.toFixed(2)}</span>`;
                html += `<span class="entity-detail">Type: ${data.type}</span>`;
                if (data.owner_id !== undefined && data.owner_id !== -1) {
                    html += `<span class="entity-detail">Owner: P${data.owner_id + 1}</span>`;
                }
                if (data.surface !== undefined) {
                    html += `<span class="entity-detail">Surface: ${data.surface}</span>`;
                }
                break;
            case 'wormhole':
                html += `<span class="entity-detail">Pos: (${Math.round(data.position.x)}, ${Math.round(data.position.y)})</span>`;
                html += `<span class="entity-detail">Target: ${data.target_id}</span>`;
                break;
        }

        infoDiv.innerHTML = html;
    }

    resetView() {
        this.observer.camera.reset();
    }

    getSelectedEntity() {
        return this.selectedEntity;
    }

    // Get interpolated version of selected entity for smooth selection rendering
    getInterpolatedSelectedEntity() {
        if (!this.selectedEntity) return null;

        // Get the current game data (interpolated if interpolation is enabled)
        const gameData = this.getGameData();
        if (!gameData) return null;

        const { type, id } = this.selectedEntity;
        const entityArray = gameData[type + 's']; // ships, asteroids, wormholes

        if (!entityArray) return null;

        const entity = entityArray.find(e => e && e.id === id);
        return entity ? { type, data: entity } : null;
    }

    getGameData() {
        if (this.interpolationEnabled && this.interpolationProgress > 0 && this.interpolationProgress < 1) {
            return this.getInterpolatedGameData();
        }
        return this.getCurrentGameData();
    }

    // Light interpolation between frames
    getInterpolatedGameData() {
        const currentFrame = this.getCurrentGameData();
        const targetFrame = this.gameStates[this.targetFrame];

        if (!currentFrame || !targetFrame || this.interpolationProgress <= 0) {
            return currentFrame;
        }

        const t = this.interpolationProgress;
        const interpolated = JSON.parse(JSON.stringify(currentFrame));

        // Interpolate ships
        interpolated.ships = this.interpolateEntities(currentFrame.ships, targetFrame.ships, t);

        // Interpolate asteroids
        interpolated.asteroids = this.interpolateEntities(currentFrame.asteroids, targetFrame.asteroids, t);

        // Wormholes don't move, but we'll include them for consistency
        interpolated.wormholes = currentFrame.wormholes;

        // Players data doesn't interpolate (discrete updates)
        interpolated.players = currentFrame.players;

        return interpolated;
    }

    interpolateEntities(currentEntities, targetEntities, t) {
        const result = [];

        // Filter out null entities and create maps for efficient lookup
        const validCurrentEntities = currentEntities.filter(e => e !== null);
        const validTargetEntities = targetEntities.filter(e => e !== null);

        const currentMap = new Map(validCurrentEntities.map(e => [e.id, e]));
        const targetMap = new Map(validTargetEntities.map(e => [e.id, e]));

        const allIds = new Set([...currentMap.keys(), ...targetMap.keys()]);

        allIds.forEach(id => {
            const current = currentMap.get(id);
            const target = targetMap.get(id);

            if (current && target) {
                // Entity exists in both frames - interpolate
                result.push(this.interpolateEntity(current, target, t));
            } else if (current && t < 0.5) {
                // Entity being removed - fade out
                result.push({...current, _fading: true, _fadeAlpha: 1 - (t * 2)});
            } else if (target && t >= 0.5) {
                // Entity being added - fade in
                result.push({...target, _fading: true, _fadeAlpha: (t - 0.5) * 2});
            }
            // Entity not visible at this interpolation point
        });

        return result;
    }

    interpolateEntity(current, target, t) {
        const interpolated = {...current};

        // Interpolate position
        if (current.position && target.position) {
            interpolated.position = {
                x: current.position.x + (target.position.x - current.position.x) * t,
                y: current.position.y + (target.position.y - current.position.y) * t
            };
        }

        // Interpolate vector for ships
        if (current.vector && target.vector) {
            interpolated.vector = {
                x: current.vector.x + (target.vector.x - current.vector.x) * t,
                y: current.vector.y + (target.vector.y - current.vector.y) * t
            };
        }

        // Interpolate numeric values for ships
        if (current.health !== undefined && target.health !== undefined) {
            interpolated.health = Math.round(current.health + (target.health - current.health) * t);
        }

        if (current.fuel !== undefined && target.fuel !== undefined) {
            interpolated.fuel = Math.round(current.fuel + (target.fuel - current.fuel) * t);
        }

        if (current.cargo !== undefined && target.cargo !== undefined) {
            interpolated.cargo = Math.round(current.cargo + (target.cargo - current.cargo) * t);
        }

        return interpolated;
    }

    // Start interpolation to target frame
    startInterpolation(targetFrame) {
        if (targetFrame === this.currentFrame) {
            this.interpolationProgress = 0;
            this.targetFrame = this.currentFrame;
            return;
        }

        this.targetFrame = targetFrame;
        this.interpolationProgress = 0;
        this.lastFrameTime = performance.now();
    }

    // Update interpolation progress
    updateInterpolation() {
        if (!this.interpolationEnabled || this.interpolationProgress >= 1) {
            return false;
        }

        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;

        // Complete interpolation in 500ms for smooth transitions
        const interpolationDuration = 500;
        this.interpolationProgress += deltaTime / interpolationDuration;

        if (this.interpolationProgress >= 1) {
            this.interpolationProgress = 1;
            this.currentFrame = this.targetFrame;
            this.interpolationProgress = 0;
            this.updateTimelineUI();
            this.updateEntityInfo(); // Update entity info when interpolation completes
            return true; // Interpolation complete
        }

        // Update entity info during interpolation for smooth real-time updates
        this.updateEntityInfo();
        return false; // Interpolation still in progress
    }

    // Set interpolation mode
    setInterpolationEnabled(enabled) {
        this.interpolationEnabled = enabled;
        if (!enabled) {
            this.interpolationProgress = 0;
            this.targetFrame = this.currentFrame;
        }
    }

    // Check if currently interpolating
    isInterpolating() {
        return this.interpolationEnabled && this.interpolationProgress > 0 && this.interpolationProgress < 1;
    }

    // Stop interpolation and preserve current frame position
    stopInterpolation() {
        if (this.interpolationProgress > 0 && this.interpolationProgress < 1) {
            // If we're in the middle of interpolation, complete it to the current visual state
            this.currentFrame = this.targetFrame;
            this.interpolationProgress = 0;
            this.updateTimelineUI();
        }
    }
}