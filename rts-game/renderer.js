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
        this.ctx.fillStyle = '#1e3752'; // Eau (gris foncé / bleu)
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Dessine l'état du jeu (la grille logic)
    draw(game) {
        this.clear();

        if (!game.mapLoaded) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText("Chargement de la carte...", this.canvas.width/2, this.canvas.height/2);
            return;
        }

        const cellSize = game.cellSize;

        // Dessiner la terre et les entités
        for (let y = 0; y < game.gridHeight; y++) {
            for (let x = 0; x < game.gridWidth; x++) {
                const cell = game.grid[y][x];

                if (cell.isLand) {
                    if (cell.owner !== null) {
                        const entity = game.entities[cell.owner];
                        if (entity) {
                            this.ctx.fillStyle = entity.color;
                        } else {
                            this.ctx.fillStyle = '#bdc3c7'; // Terre par défaut (gris clair)
                        }
                    } else {
                        this.ctx.fillStyle = '#bdc3c7'; // Terre (gris clair)
                    }
                    this.ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
            }
        }
    }
}
