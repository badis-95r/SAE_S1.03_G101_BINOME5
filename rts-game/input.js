export class InputHandler {
    constructor(canvas, game, renderer, ui) {
        this.canvas = canvas;
        this.game = game;
        this.renderer = renderer;
        this.ui = ui;

        this.init();
    }

    init() {
        // Clic sur le canvas pour attaquer
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Convertir le clic écran en coordonnées de grille
            const { gridX, gridY } = this.renderer.screenToGrid(x, y, this.game.cellSize);

            // Déclencher l'attaque vers cette cible
            this.game.attack(gridX, gridY);
        });

        // Molette de la souris pour ajuster le pourcentage
        this.canvas.addEventListener('wheel', (e) => {
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
