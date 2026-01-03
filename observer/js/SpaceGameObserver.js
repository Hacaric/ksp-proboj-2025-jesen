class SpaceGameObserver {
    constructor(redirectUrl = null) {
        this.canvas = document.getElementById('canvas');
        this.animationFrameId = null;

        this.camera = new Camera(this.canvas);
        this.dataManager = new GameDataManager(this);
        this.renderer = new Renderer(this.canvas, this.camera, this.dataManager.getGameData(), this.dataManager.getSelectedEntity(), this.dataManager);
        this.inputHandler = new InputHandler(this.canvas, this.camera, this);
        this.timelineManager = new TimelineManager(this, this.dataManager, redirectUrl);

        this.old_camera_footprint = null;
        this.oldReplayTime = null;
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

    deselectEntity() {
        this.dataManager.deselectEntity();
    }

    animate() {
        this.camera.update();
        
        let camera_data = this.camera.getDataFootPrint();
        let camera_moved = (camera_data != this.old_camera_footprint);
        this.old_camera_footprint = camera_data
        let currentReplayTime = this.dataManager.currentFrame;
        let replayFrameChanged = currentReplayTime != this.oldReplayTime;
        this.oldReplayTime = currentReplayTime;
        
        let should_update = camera_moved || replayFrameChanged;
        if (should_update){
            this.renderer.gameData = this.dataManager.getGameData();
            this.renderer.selectedEntity = this.dataManager.getInterpolatedSelectedEntity();
            this.renderer.render();
        } else {
            // console.log("Skipping rendering...");
        }
        
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
}