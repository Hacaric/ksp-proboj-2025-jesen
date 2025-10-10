class TimelineManager {
    constructor(observer, dataManager) {
        this.observer = observer;
        this.dataManager = dataManager;
        this.isPlaying = false;
        this.isPaused = false;
        this.playInterval = null;
        this.playSpeed = 1000; // milliseconds between frames
        this.lastFrameTime = 0;
        this.frameAccumulator = 0;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        const frameSlider = document.getElementById('frameSlider');
        const speedSelect = document.getElementById('speedSelect');
        const interpolationToggle = document.getElementById('interpolationToggle');

        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        }

        if (frameSlider) {
            frameSlider.addEventListener('input', (e) => this.onFrameSliderChange(e));
        }

        if (speedSelect) {
            speedSelect.addEventListener('change', (e) => this.onSpeedChange(e));
        }

        if (interpolationToggle) {
            interpolationToggle.addEventListener('change', (e) => this.onInterpolationToggle(e));
        }

        // Initialize play button state
        this.updatePlayButtonState();
    }

    // Update timeline when data is loaded
    onDataLoaded() {
        this.updatePlayButtonState();
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if (this.dataManager.getTotalFrames() <= 1) return;

        this.isPlaying = true;
        this.isPaused = false;
        this.updatePlayPauseUI();
        this.updatePlayButtonState();

        this.lastFrameTime = performance.now();
        this.frameAccumulator = 0;

        // Simple playback with frame stepping
        this.playInterval = setInterval(() => {
            this.advanceFrame();
        }, 16); // ~60fps for smooth animation
    }

    pause() {
        this.isPlaying = false;
        this.isPaused = true;
        this.updatePlayPauseUI();
        this.updatePlayButtonState();

        if (this.playInterval) {
            clearInterval(this.playInterval);
            this.playInterval = null;
        }

        // Stop interpolation progress but preserve current frame
        this.dataManager.stopInterpolation();
    }

    updatePlayPauseUI() {
        const playIcon = document.getElementById('playIcon');
        const playText = document.getElementById('playText');

        if (playIcon && playText) {
            if (this.isPlaying) {
                playIcon.textContent = '⏸';
                playText.textContent = 'Pause';
            } else {
                playIcon.textContent = '▶';
                playText.textContent = 'Play';
            }
        }
    }

    updatePlayButtonState() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        const totalFrames = this.dataManager.getTotalFrames();

        if (playPauseBtn) {
            playPauseBtn.disabled = totalFrames <= 1;
        }
    }

    onFrameSliderChange(e) {
        const frame = parseInt(e.target.value);
        this.dataManager.setCurrentFrame(frame);
    }

    onSpeedChange(e) {
        this.playSpeed = parseInt(e.target.value);

        // If currently playing, restart with new speed
        if (this.isPlaying) {
            this.pause();
            this.play();
        }
    }

    onInterpolationToggle(e) {
        const enabled = e.target.checked;
        this.dataManager.setInterpolationEnabled(enabled);
    }

    // Simple frame advancement without interpolation during playback
    advanceFrame() {
        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;

        // Accumulate time based on playback speed
        this.frameAccumulator += deltaTime;

        // Check if it's time to advance to next frame
        if (this.frameAccumulator >= this.playSpeed) {
            this.frameAccumulator = 0;

            // Check if we can advance to next frame
            if (this.dataManager.getCurrentFrame() < this.dataManager.getTotalFrames() - 1) {
                this.dataManager.nextFrame();
            } else {
                // Reached the end, pause playback
                this.pause();
            }
        }
    }

    nextFrame() {
        const currentFrame = this.dataManager.getCurrentFrame();
        if (currentFrame < this.dataManager.getTotalFrames() - 1) {
            this.dataManager.startInterpolation(currentFrame + 1);
            return true;
        }
        return false;
    }

    previousFrame() {
        const currentFrame = this.dataManager.getCurrentFrame();
        if (currentFrame > 0) {
            this.dataManager.startInterpolation(currentFrame - 1);
            return true;
        }
        return false;
    }

    firstFrame() {
        this.dataManager.startInterpolation(0);
    }

    lastFrame() {
        const totalFrames = this.dataManager.getTotalFrames();
        this.dataManager.startInterpolation(totalFrames - 1);
    }

    setFrame(frame) {
        this.dataManager.startInterpolation(frame);
    }

    getCurrentFrame() {
        return this.dataManager.getCurrentFrame();
    }

    getTotalFrames() {
        return this.dataManager.getTotalFrames();
    }

    // Keyboard controls
    handleKeyDown(e) {
        switch(e.key) {
            case ' ':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.previousFrame();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextFrame();
                break;
            case 'Home':
                e.preventDefault();
                this.firstFrame();
                break;
            case 'End':
                e.preventDefault();
                this.lastFrame();
                break;
        }
    }

    // Clean up when destroying
    destroy() {
        this.pause();
    }
}