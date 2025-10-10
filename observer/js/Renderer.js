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
        this.generateStars();
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

    toggleGrid() {
        this.showGrid = !this.showGrid;
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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
            const pos = this.camera.worldToScreen(wormhole.position.x, wormhole.position.y);

            const connected = this.gameData.wormholes.find(w =>
                w.id === wormhole.id && w.target_id === wormhole.target_id &&
                (w.position.x !== wormhole.position.x || w.position.y !== wormhole.position.y)
            );

            if (connected) {
                const connectedPos = this.camera.worldToScreen(connected.position.x, connected.position.y);
                this.ctx.strokeStyle = 'rgba(255, 107, 74, 0.5)';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.moveTo(pos.x, pos.y);
                this.ctx.lineTo(connectedPos.x, connectedPos.y);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }

            const radius = 20 * this.camera.zoom;
            this.ctx.fillStyle = '#ff6b4a';
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#ffaa4a';
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, radius * 0.6, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = `${12 * this.camera.zoom}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(wormhole.id.toString(), pos.x, pos.y + 4 * this.camera.zoom);
        });
    }

    renderAsteroids() {
        this.gameData.asteroids.forEach(asteroid => {
            const pos = this.camera.worldToScreen(asteroid.position.x, asteroid.position.y);
            const radius = asteroid.size * this.camera.zoom;

            this.ctx.fillStyle = asteroid.type === 0 ? '#888888' : '#aaaa88';
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = asteroid.type === 0 ? '#666666' : '#888866';
            this.ctx.beginPath();
            this.ctx.arc(pos.x - radius * 0.3, pos.y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    renderShips() {
        this.gameData.ships.forEach(ship => {
            const pos = this.camera.worldToScreen(ship.position.x, ship.position.y);
            const size = 150 * this.camera.zoom;

            const playerColor = this.dataManager.getPlayerColor(ship.player);
            this.ctx.fillStyle = playerColor;

            // Calculate ship angle based on vector or default to pointing right
            let angle = 0;
            if (ship.vector.x !== 0 || ship.vector.y !== 0) {
                angle = Math.atan2(ship.vector.y, ship.vector.x);
            }

            // Draw triangle ship
            this.ctx.save();
            this.ctx.translate(pos.x, pos.y);
            this.ctx.rotate(angle);

            this.ctx.beginPath();
            this.ctx.moveTo(size, 0);
            this.ctx.lineTo(-size * 0.7, -size * 0.7);
            this.ctx.lineTo(-size * 0.7, size * 0.7);
            this.ctx.closePath();
            this.ctx.fill();

            this.ctx.restore();

            // Draw health bar
            if (ship.health > 0) {
                const healthPercent = ship.health / 100;
                this.ctx.fillStyle = healthPercent > 0.5 ? '#4aff4a' : healthPercent > 0.25 ? '#ffff4a' : '#ff4a4a';
                this.ctx.fillRect(pos.x - size, pos.y - size - 10 * this.camera.zoom, size * 2 * healthPercent, 4 * this.camera.zoom);
            }

            // Draw player number
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = `${12 * this.camera.zoom}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`P${ship.player + 1}`, pos.x, pos.y + 4 * this.camera.zoom);
        });
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
}