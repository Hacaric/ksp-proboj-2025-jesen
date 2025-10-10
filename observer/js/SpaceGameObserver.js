class SpaceGameObserver {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.animationFrameId = null;

        this.camera = new Camera(this.canvas);
        this.dataManager = new GameDataManager(this);
        this.renderer = new Renderer(this.canvas, this.camera, this.dataManager.getGameData(), this.dataManager.getSelectedEntity(), this.dataManager);
        this.inputHandler = new InputHandler(this.canvas, this.camera, this);
        this.timelineManager = new TimelineManager(this, this.dataManager);

        this.init();
    }

    init() {
        this.inputHandler.resizeCanvas();
        this.dataManager.loadGameData();
        this.animate();
    }

    selectEntityAt(x, y) {
        this.dataManager.selectEntityAt(x, y);
    }

    animate() {
        this.camera.update();

        // Update interpolation if not playing (timeline manager handles it during playback)
        if (!this.timelineManager.isPlaying) {
            this.dataManager.updateInterpolation();
        }

        this.renderer.gameData = this.dataManager.getGameData();
        this.renderer.selectedEntity = this.dataManager.getInterpolatedSelectedEntity();
        this.renderer.render();

        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
}