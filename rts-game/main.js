import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';

class Main {
    constructor() {
        this.game = new Game(window.innerWidth, window.innerHeight);
        this.renderer = new Renderer('game-canvas');

        // Eléments UI
        this.ui = {
            troopCount: document.getElementById('troop-count'),
            cellCount: document.getElementById('cell-count'),
            attackPercentInput: document.getElementById('attack-percent'),
            attackPercentDisplay: document.getElementById('attack-percent-display')
        };

        this.inputHandler = new InputHandler(this.renderer.canvas, this.game, this.renderer, this.ui);

        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    loop(currentTime) {
        // Calcul du deltaTime (si besoin futur pour animations fluides)
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Mise à jour de la logique de jeu (ticks, expansions)
        this.game.update(currentTime);

        // Mise à jour de l'UI
        this.updateUI();

        // Rendu
        this.renderer.draw(this.game);

        // Boucler
        requestAnimationFrame((time) => this.loop(time));
    }

    updateUI() {
        this.ui.troopCount.textContent = this.game.player.troops;
        this.ui.cellCount.textContent = this.game.player.cellsControlled;
    }
}

// Initialiser le jeu quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    new Main();
});
