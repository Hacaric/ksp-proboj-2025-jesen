class Camera {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.targetX = 0;
        this.targetY = 0;
        this.targetZoom = 1;
    }

    reset() {
        this.targetX = 0;
        this.targetY = 0;
        this.targetZoom = 0.03;
    }

    zoomIn() {
        this.targetZoom = Math.min(5, this.targetZoom * 1.2);
    }

    zoomOut() {
        this.targetZoom = Math.max(0.02, this.targetZoom * 0.8);
    }

    handleWheel(deltaY) {
        const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
        this.targetZoom = Math.max(0.02, Math.min(5, this.targetZoom * zoomFactor));
    }

    pan(deltaX, deltaY) {
        this.targetX -= deltaX / this.zoom;
        this.targetY -= deltaY / this.zoom;
    }

    worldToScreen(x, y) {
        return {
            x: (x - this.x) * this.zoom + this.canvas.width / 2,
            y: (y - this.y) * this.zoom + this.canvas.height / 2
        };
    }

    update() {
        let dx = this.targetX - this.x;
        let dy = this.targetY - this.y;
        let dz = this.targetZoom - this.zoom;

        if (Math.abs(dx) < 0.01) this.x = this.targetX;
        else this.x += dx * 0.1;

        if (Math.abs(dy) < 0.01) this.y = this.targetY;
        else this.y += dy * 0.1;

        if (Math.abs(dz) < 0.0001) this.zoom = this.targetZoom;
        else this.zoom += dz * 0.1;
    }

    getDataFootPrint() {
        return Math.round((
            this.x + 
            this.y + 
            this.targetX + 
            this.targetY + 
            this.zoom + 
            this.targetZoom
        ) * 100);
    }
}
