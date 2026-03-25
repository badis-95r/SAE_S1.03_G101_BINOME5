export class InputHandler {
    constructor(canvas, game, renderer, ui) {
        this.canvas = canvas;
        this.game = game;
        this.renderer = renderer;
        this.ui = ui;

        this.init();
    }

    init() {
        // Clic sur le canvas
        this.canvas.addEventListener('click', (e) => {
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
                // Déclencher l'attaque vers cette cible
                this.game.attack('player1', gridX, gridY);
            }
        });

        // Bouton Start
        if (this.ui.startBtn) {
            this.ui.startBtn.addEventListener('click', () => {
                this.game.startGame();
                if (this.ui.spawnUi) this.ui.spawnUi.classList.add('hidden');
                if (this.ui.gameUi) this.ui.gameUi.classList.remove('hidden');
            });
        }

        // Molette de la souris pour ajuster le pourcentage
        this.canvas.addEventListener('wheel', (e) => {
            if (this.game.state !== 'PLAYING') return;
            e.preventDefault(); // Empêcher le scroll de la page

            // Ajuster le pourcentage d'attaque (- ou + selon la direction du scroll)
            // ex: 5% par cran de molette
            const step = 5;
            const delta = Math.sign(e.deltaY) * -step;

            let newPercent = parseInt(this.ui.attackPercentInput.value) + delta;

            // Contraindre entre 0 et 100
            newPercent = Math.max(0, Math.min(100, newPercent));

            // Mettre à jour l'UI
            this.ui.attackPercentInput.value = newPercent;
            this.ui.attackPercentDisplay.textContent = newPercent;

            // Mettre à jour le jeu
            this.game.setAttackPercent(newPercent);
        });

        // Changement via le slider HTML
        this.ui.attackPercentInput.addEventListener('input', (e) => {
            const newPercent = parseInt(e.target.value);
            this.ui.attackPercentDisplay.textContent = newPercent;
            this.game.setAttackPercent(newPercent);
        });
    }
}
