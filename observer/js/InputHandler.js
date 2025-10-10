class InputHandler {
    constructor(canvas, camera, observer) {
        this.canvas = canvas;
        this.camera = camera;
        this.observer = observer;
        this.mouse = {
            isDown: false,
            lastX: 0,
            lastY: 0
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());

        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        this.canvas.addEventListener('click', (e) => this.onClick(e));

        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));

        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Add event listeners to UI elements if they exist
        this.addButtonListener('resetView', () => this.resetView());
        this.addButtonListener('toggleGrid', () => this.toggleGrid());
        this.addButtonListener('zoomIn', () => this.zoomIn());
        this.addButtonListener('zoomOut', () => this.zoomOut());

        // Global keyboard event listeners for timeline controls
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
    }

    addButtonListener(id, callback) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', callback);
        }
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    onMouseDown(e) {
        this.mouse.isDown = true;
        this.mouse.lastX = e.clientX;
        this.mouse.lastY = e.clientY;
    }

    onMouseMove(e) {
        this.updateCoordinates(e);

        if (this.mouse.isDown) {
            const deltaX = e.clientX - this.mouse.lastX;
            const deltaY = e.clientY - this.mouse.lastY;

            this.camera.pan(deltaX, deltaY);

            this.mouse.lastX = e.clientX;
            this.mouse.lastY = e.clientY;
        }
    }

    onMouseUp(e) {
        this.mouse.isDown = false;
    }

    onWheel(e) {
        e.preventDefault();
        this.camera.handleWheel(e.deltaY);
    }

    onClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const worldX = (x - this.canvas.width / 2) / this.camera.zoom + this.camera.x;
        const worldY = (y - this.canvas.height / 2) / this.camera.zoom + this.camera.y;

        this.observer.selectEntityAt(worldX, worldY);
    }

    onTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.mouse.isDown = true;
            this.mouse.lastX = touch.clientX;
            this.mouse.lastY = touch.clientY;
        }
    }

    onTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1 && this.mouse.isDown) {
            const touch = e.touches[0];
            const deltaX = touch.clientX - this.mouse.lastX;
            const deltaY = touch.clientY - this.mouse.lastY;

            this.camera.pan(deltaX, deltaY);

            this.mouse.lastX = touch.clientX;
            this.mouse.lastY = touch.clientY;
        }
    }

    onTouchEnd(e) {
        e.preventDefault();
        this.mouse.isDown = false;
    }

    updateCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const worldX = Math.round((x - this.canvas.width / 2) / this.camera.zoom + this.camera.x);
        const worldY = Math.round((y - this.canvas.height / 2) / this.camera.zoom + this.camera.y);

        document.getElementById('coordinates').textContent = `X: ${worldX}, Y: ${worldY}`;
    }

    resetView() {
        this.camera.reset();
    }

    toggleGrid() {
        this.observer.renderer.toggleGrid();
    }

    
    zoomIn() {
        this.camera.zoomIn();
    }

    zoomOut() {
        this.camera.zoomOut();
    }

    onKeyDown(e) {
        // Handle timeline controls if timeline manager exists
        if (this.observer.timelineManager) {
            this.observer.timelineManager.handleKeyDown(e);
        }
    }
}