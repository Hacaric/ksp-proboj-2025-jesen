class GameDataManager {
    constructor(observer) {
        this.observer = observer;
        this.gameStates = [];
        this.currentFrame = 0;
        this.selectedEntity = null;
    }

    async loadGameData() {
        // Just initialize with empty state - data will be loaded via file upload
        this.gameStates = [];
        this.currentFrame = 0;
        this.selectedEntity = null;

        console.log('GameDataManager initialized - waiting for file upload');
    }

    // Method to load data from uploaded file
    async loadUploadedData(gameStates) {
        this.gameStates = gameStates;
        this.currentFrame = 0;
        this.selectedEntity = null;

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

    // Get selected entity for rendering
    getInterpolatedSelectedEntity() {
        if (!this.selectedEntity) return null;

        // Get the current game data
        const gameData = this.getCurrentGameData();
        if (!gameData) return null;

        const { type, id } = this.selectedEntity;
        const entityArray = gameData[type + 's']; // ships, asteroids, wormholes

        if (!entityArray) return null;

        const entity = entityArray.find(e => e && e.id === id);
        return entity ? { type, data: entity } : null;
    }

    getGameData() {
        return this.getCurrentGameData();
    }
}