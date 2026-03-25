export class InputHandler {
    constructor(canvas, game, renderer, ui) {
        this.canvas = canvas;
        this.game = game;
        this.renderer = renderer;
        this.ui = ui;

        this.init();
    }

    init() {
        // État pour le pan de la caméra
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.dragDistSq = 0; // Pour différencier le drag d'un clic

        // Éviter le menu contextuel sur le clic droit
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());

        this.canvas.addEventListener('mousedown', (e) => {
            // Clic droit (2) ou clic molette (1) pour drag
            if (e.button === 2 || e.button === 1) {
                this.isDragging = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                e.preventDefault();
            } else if (e.button === 0) {
                // Pour le clic gauche, on réinitialise la distance
                this.dragDistSq = 0;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;

                this.renderer.camera.x += dx;
                this.renderer.camera.y += dy;

                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            } else if (e.buttons === 1) {
                // Si le bouton gauche est enfoncé, on track la distance de drag
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;
                this.dragDistSq += dx * dx + dy * dy;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 2 || e.button === 1) {
                this.isDragging = false;
            } else if (e.button === 0) {
                // C'est un clic gauche, s'il n'y a pas eu beaucoup de mouvement, c'est un "click" d'action
                if (this.dragDistSq < 25) { // Tolérance de 5 pixels
                    this.handleClick(e);
                }
            }
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });

        // Bouton Start
        if (this.ui.startBtn) {
            this.ui.startBtn.addEventListener('click', () => {
                this.game.startGame();
                if (this.ui.spawnUi) this.ui.spawnUi.classList.add('hidden');
                if (this.ui.gameUi) this.ui.gameUi.classList.remove('hidden');
            });
        }

        // Build City State
        this.isBuildingCity = false;
        if (this.ui.buildCityBtn) {
            this.ui.buildCityBtn.addEventListener('click', () => {
                this.isBuildingCity = true;
                this.canvas.style.cursor = 'crosshair';
            });
        }

        // Molette de la souris pour zoomer ET ajuster le pourcentage (avec shift)
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault(); // Empêcher le scroll de la page

            if (e.shiftKey && this.game.state === 'PLAYING') {
                // Si Shift est maintenu, on change le pourcentage d'attaque
                const step = 5;
                const delta = Math.sign(e.deltaY) * -step;

                let newPercent = parseInt(this.ui.attackPercentInput.value) + delta;
                newPercent = Math.max(0, Math.min(100, newPercent));

                this.ui.attackPercentInput.value = newPercent;
                this.ui.attackPercentDisplay.textContent = newPercent;
                this.game.setAttackPercent(newPercent);
            } else {
                // Sinon on gère le zoom de la caméra
                const zoomFactor = 1.1;
                const oldZoom = this.renderer.camera.zoom;

                if (e.deltaY < 0) {
                    // Zoom in
                    this.renderer.camera.zoom = Math.min(this.renderer.camera.maxZoom, oldZoom * zoomFactor);
                } else {
                    // Zoom out
                    this.renderer.camera.zoom = Math.max(this.renderer.camera.minZoom, oldZoom / zoomFactor);
                }

                // Ajuster la position (x, y) pour zoomer vers la souris
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                // Position monde actuelle sous la souris
                const worldX = (mouseX - this.renderer.camera.x) / oldZoom;
                const worldY = (mouseY - this.renderer.camera.y) / oldZoom;

                // Nouvelle position de caméra
                this.renderer.camera.x = mouseX - worldX * this.renderer.camera.zoom;
                this.renderer.camera.y = mouseY - worldY * this.renderer.camera.zoom;
            }
        });

        // Changement via le slider HTML
        this.ui.attackPercentInput.addEventListener('input', (e) => {
            const newPercent = parseInt(e.target.value);
            this.ui.attackPercentDisplay.textContent = newPercent;
            this.game.setAttackPercent(newPercent);
        });
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Convertir le clic écran en coordonnées de grille
        const { gridX, gridY } = this.renderer.screenToGrid(x, y, this.game.cellSize);

        if (this.game.state === 'SPAWN_SELECTION') {
            const success = this.game.setPlayerSpawn(gridX, gridY);
            if (success) {
                this.ui.startBtn.disabled = false;
            }
        } else if (this.game.state === 'PLAYING') {
            if (this.isBuildingCity) {
                const success = this.game.buildCity('player1', gridX, gridY);
                this.isBuildingCity = false;
                this.canvas.style.cursor = 'default';
                if (!success) {
                    console.log("Impossible de construire la ville ici ou fonds insuffisants.");
                }
            } else {
                // Déclencher l'attaque vers cette cible
                this.game.attack('player1', gridX, gridY);
            }
        }
    }
}
