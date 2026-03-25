export class Renderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.mapImage = null;
        this.resize();

        window.addEventListener('resize', () => this.resize());
    }

    setMapImage(img) {
        this.mapImage = img;
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
        this.ctx.fillStyle = '#1e3752'; // Eau (gris foncé / bleu) - fallback
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Dessine l'état du jeu (la grille logic)
    draw(game) {
        if (!game.mapLoaded || !this.mapImage) {
            this.clear();
            this.ctx.fillStyle = 'white';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText("Chargement de la carte...", this.canvas.width/2, this.canvas.height/2);
            return;
        }

        // Dessiner l'image de la carte en fond (ordre de rendu correct)
        this.ctx.drawImage(this.mapImage, 0, 0, game.gridWidth * game.cellSize, game.gridHeight * game.cellSize);

        const cellSize = game.cellSize;

        // Dessiner uniquement les entités par dessus
        for (let y = 0; y < game.gridHeight; y++) {
            for (let x = 0; x < game.gridWidth; x++) {
                const cell = game.grid[y][x];

                // On ne dessine que les cellules contrôlées, la carte s'occupe de la terre neutre et de l'eau
                if (cell.isLand && cell.owner !== null) {
                    const entity = game.entities[cell.owner];
                    if (entity) {
                        this.ctx.fillStyle = entity.color;
                        this.ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                    }
                }
            }
        }
    }
}
