import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';

class Main {
    constructor() {
        this.game = new Game(window.innerWidth, window.innerHeight);
        window.gameInstance = this.game;
        this.renderer = new Renderer('game-canvas');

        // Eléments UI
        this.ui = {
            gameUi: document.getElementById('game-ui'),
            spawnUi: document.getElementById('spawn-ui'),
            startBtn: document.getElementById('start-btn'),
            troopCount: document.getElementById('troop-count'),
            cellCount: document.getElementById('cell-count'),
            goldCount: document.getElementById('gold-count'),
            buildCityBtn: document.getElementById('build-city-btn'),
            attackPercentInput: document.getElementById('attack-percent'),
            attackPercentDisplay: document.getElementById('attack-percent-display')
        };

        this.inputHandler = new InputHandler(this.renderer.canvas, this.game, this.renderer, this.ui);

        this.loadMap();
    }

    loadMap() {
        const img = new Image();
        img.onload = () => {
            console.log("Image chargée avec succès !");
            this.game.loadMapFromImage(img);
            this.renderer.setMapImage(img, this.game); // Passer l'image au renderer

            // Démarrer la boucle seulement quand l'image est chargée
            this.lastTime = performance.now();
            this.loop(this.lastTime);
        };
        img.src = 'map.png'; // Chemin vers l'image
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

        if (this.game.state === 'PLAYING') {
            this.ui.goldCount.textContent = this.game.player.gold;
            if (this.ui.buildCityBtn) {
                this.ui.buildCityBtn.disabled = this.game.player.gold < 500;
            }
        }
    }
}

// Initialiser le jeu quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    new Main();
});
window.debugGame = function(gameObj) { window.gameInstance = gameObj; }
