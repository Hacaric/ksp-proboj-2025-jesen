class Renderer {
    constructor(canvas, camera, gameData, selectedEntity, dataManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.camera = camera;
        this.gameData = gameData;
        this.selectedEntity = selectedEntity;
        this.dataManager = dataManager;
        this.showGrid = false;
        this.stars = [];
        this.snowParticles = [];
        this.generateStars();
        this.generateSnowParticles();
    }

    generateStars() {
        this.stars = [];
        for (let i = 0; i < 200; i++) {
            this.stars.push({
                x: Math.random() * 40000 - 20000,
                y: Math.random() * 40000 - 20000,
                size: Math.random() * 2 + 0.5,
                brightness: Math.random() * 0.8 + 0.2
            });
        }
    }

    generateSnowParticles() {
        this.snowParticles = [];
        for (let i = 0; i < 150; i++) {
            this.snowParticles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height - this.canvas.height,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 1 + 0.5,
                windSpeed: Math.random() * 0.5 - 0.25,
                opacity: Math.random() * 0.6 + 0.4
            });
        }
    }

    updateSnowParticles() {
        this.snowParticles.forEach(particle => {
            particle.y += particle.speed;
            particle.x += particle.windSpeed;

            // Reset particle when it goes off screen
            if (particle.y > this.canvas.height) {
                particle.y = -10;
                particle.x = Math.random() * this.canvas.width;
            }

            // Wrap horizontally
            if (particle.x > this.canvas.width) {
                particle.x = 0;
            } else if (particle.x < 0) {
                particle.x = this.canvas.width;
            }
        });
    }

    renderSnow() {
        this.ctx.save();
        this.snowParticles.forEach(particle => {
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.restore();
    }

    drawSantaHat(x, y, size) {
        this.ctx.save();

        // Make everything 2x larger
        const scaledSize = size * 1.5;

        // Draw red triangle hat (pointing up)
        this.ctx.fillStyle = '#c41e3a';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - scaledSize * 2.5);  // Top point of hat
        this.ctx.lineTo(x - scaledSize * 0.7, y - scaledSize * 0.5);  // Bottom left
        this.ctx.lineTo(x + scaledSize * 0.7, y - scaledSize * 0.5);  // Bottom right
        this.ctx.closePath();
        this.ctx.fill();

        // Draw white trim at bottom of hat
        this.ctx.fillStyle = '#f0f8ff';
        this.ctx.fillRect(x - scaledSize * 0.8, y - scaledSize * 0.7, scaledSize * 1.6, scaledSize * 0.4);

        // Draw white ball at tip of hat
        this.ctx.beginPath();
        this.ctx.arc(x, y - scaledSize * 2.5, scaledSize * 0.3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    toggleGrid() {
        this.showGrid = !this.showGrid;
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and render snow particles
        this.updateSnowParticles();
        this.renderSnow();

        // Stars disabled for now
        // this.renderStars();

        if (this.showGrid) {
            this.renderGrid();
        }

        if (!this.gameData) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Loading game data...', this.canvas.width / 2, this.canvas.height / 2);
            return;
        }


        this.renderBoundary();
        this.renderWormholes();
        this.renderAsteroids();
        this.renderShips();

        if (this.selectedEntity) {
            this.renderSelection();
            this.renderSelectedWormholePath();
        }
    }

    renderStars() {
        this.ctx.fillStyle = '#ffffff';
        this.stars.forEach(star => {
            const pos = this.camera.worldToScreen(star.x, star.y);
            if (pos.x > -10 && pos.x < this.canvas.width + 10 &&
                pos.y > -10 && pos.y < this.canvas.height + 10) {
                this.ctx.globalAlpha = star.brightness;
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, star.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        this.ctx.globalAlpha = 1;
    }

    renderGrid() {
        const gridSize = 1000;
        const startX = Math.floor((this.camera.x - this.canvas.width / 2 / this.camera.zoom) / gridSize) * gridSize;
        const endX = Math.ceil((this.camera.x + this.canvas.width / 2 / this.camera.zoom) / gridSize) * gridSize;
        const startY = Math.floor((this.camera.y - this.canvas.height / 2 / this.camera.zoom) / gridSize) * gridSize;
        const endY = Math.ceil((this.camera.y + this.canvas.height / 2 / this.camera.zoom) / gridSize) * gridSize;

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        for (let x = startX; x <= endX; x += gridSize) {
            const pos = this.camera.worldToScreen(x, 0);
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, 0);
            this.ctx.lineTo(pos.x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = startY; y <= endY; y += gridSize) {
            const pos = this.camera.worldToScreen(0, y);
            this.ctx.beginPath();
            this.ctx.moveTo(0, pos.y);
            this.ctx.lineTo(this.canvas.width, pos.y);
            this.ctx.stroke();
        }
    }

    renderBoundary() {
        const center = this.camera.worldToScreen(0, 0);
        const radius = this.gameData.radius * this.camera.zoom;

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.rect(center.x - radius, center.y - radius, radius * 2, radius * 2);
        this.ctx.stroke();
    }

    renderWormholes() {
        this.gameData.wormholes.forEach(wormhole => {
            if (!wormhole || wormhole.position === undefined || wormhole.id === undefined) {
                return;
            }

            const pos = this.camera.worldToScreen(wormhole.position.x, wormhole.position.y);

            const connected = this.gameData.wormholes.find(w =>
                w.id === wormhole.id && w.target_id === wormhole.target_id &&
                (w.position.x !== wormhole.position.x || w.position.y !== wormhole.position.y)
            );

            if (connected) {
                const connectedPos = this.camera.worldToScreen(connected.position.x, connected.position.y);
                // Icy blue connection line
                this.ctx.strokeStyle = 'rgba(135, 206, 235, 0.6)';
                this.ctx.lineWidth = 3;
                this.ctx.setLineDash([8, 4]);
                this.ctx.beginPath();
                this.ctx.moveTo(pos.x, pos.y);
                this.ctx.lineTo(connectedPos.x, connectedPos.y);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }

            const radius = 20 * this.camera.zoom;
            // Icy blue outer ring with glow effect
            const gradient = this.ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius);
            gradient.addColorStop(0, 'rgba(135, 206, 235, 0.8)');
            gradient.addColorStop(0.7, 'rgba(173, 216, 230, 0.6)');
            gradient.addColorStop(1, 'rgba(135, 206, 235, 0.2)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Inner bright core
            this.ctx.fillStyle = '#f0f8ff';
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, radius * 0.6, 0, Math.PI * 2);
            this.ctx.fill();

            // Glowing effect
            this.ctx.shadowColor = '#87ceeb';
            this.ctx.shadowBlur = 10 * this.camera.zoom;
            this.ctx.strokeStyle = 'rgba(240, 248, 255, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;

            this.ctx.fillStyle = '#0a1929';
            this.ctx.font = `${12 * this.camera.zoom}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(wormhole.id.toString(), pos.x, pos.y + 4 * this.camera.zoom);
        });
    }

    renderAsteroids() {
        this.gameData.asteroids.forEach(asteroid => {
            if (!asteroid || asteroid.position === undefined || asteroid.size === undefined) {
                return;
            }

            const pos = this.camera.worldToScreen(asteroid.position.x, asteroid.position.y);
            const radius = asteroid.size * this.camera.zoom;

            // Create snowball gradient effect
            const gradient = this.ctx.createRadialGradient(
                pos.x - radius * 0.3, pos.y - radius * 0.3, 0,
                pos.x, pos.y, radius
            );

            if (asteroid.type === 0) {
                // Light snowball
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(0.7, '#e0f2ff');
                gradient.addColorStop(1, '#b8d4e3');
            } else {
                // Slightly blue-tinted ice chunk
                gradient.addColorStop(0, '#f0f8ff');
                gradient.addColorStop(0.7, '#d6e8f7');
                gradient.addColorStop(1, '#a8c4e0');
            }

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Add crystalline highlights
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(pos.x - radius * 0.3, pos.y - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
            this.ctx.fill();

            // Add subtle shadow
            this.ctx.fillStyle = 'rgba(10, 25, 41, 0.2)';
            this.ctx.beginPath();
            this.ctx.arc(pos.x + radius * 0.2, pos.y + radius * 0.2, radius * 0.8, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    renderShips() {
        this.gameData.ships.forEach(ship => {
            // Skip invalid ship data to prevent rendering errors
            if (!ship || ship.position === undefined || ship.health === undefined) {
                console.warn("Skipping invalid ship data:", ship);
                return;
            }

            const pos = this.camera.worldToScreen(ship.position.x, ship.position.y);
            const size = 50 * this.camera.zoom;

            // Check if ship is destroyed - be more defensive about undefined values
            const isDestroyed = (ship.health === 0) || (ship.is_destroyed === true) || (ship.health <= 0);

            // Check if this is a mothership (type 0) - motherships should never show destroyed status or health bars
            const isMothership = ship.type === 0;

            // Safely get player color with fallback
            let playerColor = '#ffffff';
            try {
                playerColor = this.dataManager.getPlayerColor(ship.player);
            } catch (error) {
                console.warn("Error getting player color for ship:", ship, error);
            }

            // Set color and opacity based on ship status, but motherships always have full opacity
            if (isMothership) {
                this.ctx.fillStyle = playerColor;
                this.ctx.globalAlpha = 1.0; // Motherships always full opacity
            } else if (isDestroyed) {
                this.ctx.fillStyle = this.getDestroyedColor(playerColor);
                this.ctx.globalAlpha = 0.4; // Reduced opacity for destroyed ships
            } else {
                this.ctx.fillStyle = playerColor;
                this.ctx.globalAlpha = 1.0;
            }

            // Calculate ship angle based on vector or default to pointing right
            let angle = 0;
            if (ship.vector && (ship.vector.x !== 0 || ship.vector.y !== 0)) {
                try {
                    angle = Math.atan2(ship.vector.y, ship.vector.x);
                } catch (error) {
                    console.warn("Error calculating ship angle:", ship.vector, error);
                    angle = 0;
                }
            }

            // Draw ship based on type
            this.ctx.save();
            this.ctx.translate(pos.x, pos.y);
            this.ctx.rotate(angle);

            // Safely draw ship type with fallback
            try {
                this.drawShipByType(ship.type || 0, size);
            } catch (error) {
                console.warn("Error drawing ship type:", ship.type, error);
                // Draw a basic triangle as fallback
                this.ctx.beginPath();
                this.ctx.moveTo(size, 0);
                this.ctx.lineTo(-size, -size/2);
                this.ctx.lineTo(-size, size/2);
                this.ctx.closePath();
                this.ctx.fill();
            }

            // Add X mark for destroyed ships (but not motherships)
            if (isDestroyed && !isMothership) {
                this.drawDestroyedMark(size);
            }

            // Reset globalAlpha before drawing health bar to keep it fully visible
            this.ctx.globalAlpha = 1.0;

            // Draw health bar or destroyed label (but not for motherships)
            if (!isMothership) {
                if (ship.health > 0 && !isDestroyed) {
                    const healthPercent = ship.health / 100;
                    this.ctx.fillStyle = healthPercent > 0.5 ? '#4aff4a' : healthPercent > 0.25 ? '#ffff4a' : '#ff4a4a';
                    // Position healthbar above the ship in screen space, not world space
                    this.ctx.fillRect(-size, -size - 10 * this.camera.zoom, size * 2 * healthPercent, 4 * this.camera.zoom);
                } else if (isDestroyed) {
                    this.drawDestroyedLabel(size);
                }
            }

            this.ctx.restore();

            // Draw Santa hat on all ships (properly scaled and positioned)
            if (!isDestroyed) {
                let hatSize, hatY;

                if (isMothership) {
                    // Large hat for mothership
                    hatSize = size * 1.2;  // Much larger for mothership
                    hatY = pos.y - size * 3.5;  // Position well above the large mothership
                } else {
                    // Medium-sized hat for regular ships
                    hatSize = size * 0.6;  // Larger than before for better visibility
                    hatY = pos.y - size * 1.8;  // Position above the ship triangle
                }

                this.drawSantaHat(pos.x, hatY, hatSize);
            }

            // Draw player number
            this.ctx.fillStyle = isDestroyed ? '#aaaaaa' : '#ffffff';
            this.ctx.font = `${12 * this.camera.zoom}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`P${ship.player}`, pos.x, pos.y + 4 * this.camera.zoom);

            // Reset globalAlpha
            this.ctx.globalAlpha = 1.0;
        });
    }

    drawShipByType(shipType, size) {
        switch (shipType) {
            case 0: // MotherShip
                this.drawMotherShip(size);
                break;
            case 1: // SuckerShip
                this.drawSuckerShip(size);
                break;
            case 2: // DrillShip
                this.drawDrillShip(size);
                break;
            case 3: // TankerShip
                this.drawTankerShip(size);
                break;
            case 4: // TruckShip
                this.drawTruckShip(size);
                break;
            case 5: // BattleShip
                this.drawBattleShip(size);
                break;
            default:
                // Default triangle for unknown types
                this.drawDefaultShip(size);
        }
    }

    drawMotherShip(size) {
        // Large hexagon shape for MotherShip
        size *= 2
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = size * Math.cos(angle);
            const y = size * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();

        // Christmas wreath instead of crown
        this.ctx.strokeStyle = '#228b22';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size * 1.2, 0, Math.PI * 2);
        this.ctx.stroke();

        // Add berries to wreath
        const berryPositions = [0, Math.PI * 0.33, Math.PI * 0.67, Math.PI];
        this.ctx.fillStyle = '#c41e3a';
        berryPositions.forEach(angle => {
            const x = Math.cos(angle) * size * 1.2;
            const y = Math.sin(angle) * size * 1.2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Note: Santa hat is now drawn in renderShips method to ensure proper positioning
    }

    drawSuckerShip(size) {
        // Basic triangle
        this.ctx.beginPath();
        this.ctx.moveTo(size, 0);
        this.ctx.lineTo(-size * 0.7, -size * 0.7);
        this.ctx.lineTo(-size * 0.7, size * 0.7);
        this.ctx.closePath();
        this.ctx.fill();

        // Circular suction indicator
        this.ctx.strokeStyle = '#00aaff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(size * 0.3, 0, size * 0.3, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    drawDrillShip(size) {
        // Basic triangle
        this.ctx.beginPath();
        this.ctx.moveTo(size, 0);
        this.ctx.lineTo(-size * 0.7, -size * 0.7);
        this.ctx.lineTo(-size * 0.7, size * 0.7);
        this.ctx.closePath();
        this.ctx.fill();

        // Drill bit/spike indicator
        this.ctx.fillStyle = '#888888';
        this.ctx.beginPath();
        this.ctx.moveTo(size * 1.2, 0);
        this.ctx.lineTo(size * 0.8, -size * 0.2);
        this.ctx.lineTo(size * 0.8, size * 0.2);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawTankerShip(size) {
        // Basic triangle
        this.ctx.beginPath();
        this.ctx.moveTo(size, 0);
        this.ctx.lineTo(-size * 0.7, -size * 0.7);
        this.ctx.lineTo(-size * 0.7, size * 0.7);
        this.ctx.closePath();
        this.ctx.fill();

        // Fuel tank cylinder
        this.ctx.fillStyle = '#666666';
        this.ctx.fillRect(-size * 0.3, -size * 0.4, size * 0.6, size * 0.8);
    }

    drawTruckShip(size) {
        // Basic triangle
        this.ctx.beginPath();
        this.ctx.moveTo(size, 0);
        this.ctx.lineTo(-size * 0.7, -size * 0.7);
        this.ctx.lineTo(-size * 0.7, size * 0.7);
        this.ctx.closePath();
        this.ctx.fill();

        // Cargo box
        this.ctx.strokeStyle = '#8b4513';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(-size * 0.4, -size * 0.3, size * 0.5, size * 0.6);
    }

    drawBattleShip(size) {
        // Basic triangle
        this.ctx.beginPath();
        this.ctx.moveTo(size, 0);
        this.ctx.lineTo(-size * 0.7, -size * 0.7);
        this.ctx.lineTo(-size * 0.7, size * 0.7);
        this.ctx.closePath();
        this.ctx.fill();

        // Cannon/weapon indicator
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(size * 0.5, 0);
        this.ctx.lineTo(size * 1.3, 0);
        this.ctx.stroke();
    }

    drawDefaultShip(size) {
        // Default triangle for unknown ship types
        this.ctx.beginPath();
        this.ctx.moveTo(size, 0);
        this.ctx.lineTo(-size * 0.7, -size * 0.7);
        this.ctx.lineTo(-size * 0.7, size * 0.7);
        this.ctx.closePath();
        this.ctx.fill();
    }

    renderSelection() {
        const { type, data } = this.selectedEntity;
        let pos, radius;

        switch (type) {
            case 'ship':
                pos = this.camera.worldToScreen(data.position.x, data.position.y);
                radius = 160 * this.camera.zoom;
                break;
            case 'asteroid':
                pos = this.camera.worldToScreen(data.position.x, data.position.y);
                radius = (data.size + 10) * this.camera.zoom;
                break;
            case 'wormhole':
                pos = this.camera.worldToScreen(data.position.x, data.position.y);
                radius = 30 * this.camera.zoom;
                break;
        }

        this.ctx.strokeStyle = '#ffff4a';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    renderSelectedWormholePath() {
        if (!this.selectedEntity || this.selectedEntity.type !== 'wormhole') return;

        const selectedWormhole = this.selectedEntity.data;
        const targetWormhole = this.gameData.wormholes.find(w =>
            w.id === selectedWormhole.target_id && w.position !== selectedWormhole.position
        );

        if (targetWormhole) {
            const startPos = this.camera.worldToScreen(selectedWormhole.position.x, selectedWormhole.position.y);
            const endPos = this.camera.worldToScreen(targetWormhole.position.x, targetWormhole.position.y);

            this.ctx.strokeStyle = '#00ff00';
            this.ctx.lineWidth = 4;
            this.ctx.setLineDash([10, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(startPos.x, startPos.y);
            this.ctx.lineTo(endPos.x, endPos.y);
            this.ctx.stroke();
            this.ctx.setLineDash([]);

            const angle = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x);
            const arrowLength = 15;
            this.ctx.fillStyle = '#00ff00';
            this.ctx.beginPath();
            this.ctx.moveTo(endPos.x, endPos.y);
            this.ctx.lineTo(
                endPos.x - arrowLength * Math.cos(angle - Math.PI / 6),
                endPos.y - arrowLength * Math.sin(angle - Math.PI / 6)
            );
            this.ctx.lineTo(
                endPos.x - arrowLength * Math.cos(angle + Math.PI / 6),
                endPos.y - arrowLength * Math.sin(angle + Math.PI / 6)
            );
            this.ctx.closePath();
            this.ctx.fill();
        }
    }

    getDestroyedColor(originalColor) {
        // Convert the original color to grayscale for destroyed ships
        // Simple approach: extract RGB components and convert to gray
        const r = parseInt(originalColor.slice(1, 3), 16);
        const g = parseInt(originalColor.slice(3, 5), 16);
        const b = parseInt(originalColor.slice(5, 7), 16);
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        return `#${gray.toString(16).padStart(2, '0')}${gray.toString(16).padStart(2, '0')}${gray.toString(16).padStart(2, '0')}`;
    }

    drawDestroyedMark(size) {
        // Draw red X mark over destroyed ships
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = Math.max(2, 4 * this.camera.zoom);
        this.ctx.beginPath();
        this.ctx.moveTo(-size * 0.6, -size * 0.6);
        this.ctx.lineTo(size * 0.6, size * 0.6);
        this.ctx.moveTo(size * 0.6, -size * 0.6);
        this.ctx.lineTo(-size * 0.6, size * 0.6);
        this.ctx.stroke();
    }

    drawDestroyedLabel(size) {
        // Draw "DESTROYED" text above the ship
        this.ctx.fillStyle = '#ff0000';
        this.ctx.font = `bold ${10 * this.camera.zoom}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('DESTROYED', 0, -size - 15 * this.camera.zoom);
    }
}