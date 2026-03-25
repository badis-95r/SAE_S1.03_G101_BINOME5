export class Renderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resize();

        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    // Convertit les coordonnées de l'écran en coordonnées de grille
    screenToGrid(x, y, cellSize) {
        return {
            gridX: Math.floor(x / cellSize),
            gridY: Math.floor(y / cellSize)
        };
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#e0e0e0'; // Couleur de fond (cellules neutres)
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Dessine l'état du jeu (la grille logic)
    draw(game) {
        this.clear();

        const cellSize = game.cellSize;

        // Dessine les cellules contrôlées
        for (let y = 0; y < game.gridHeight; y++) {
            for (let x = 0; x < game.gridWidth; x++) {
                const cell = game.grid[y][x];

                if (cell.owner === game.player.id) {
                    this.ctx.fillStyle = game.player.color;
                    this.ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

                    // Optionnel : bordure de cellule contrôlée pour un aspect plus "grille" si souhaité,
                    // mais l'instruction demandait invisible pour le joueur.
                    // this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                    // this.ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
                } else if (cell.owner !== null) {
                    // Pour de futurs joueurs
                    this.ctx.fillStyle = 'red'; // Ex: joueur ennemi
                    this.ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
            }
        }

        // Optionnel : un indicateur pour la cellule cliquée en cours d'attaque ?
    }
}
