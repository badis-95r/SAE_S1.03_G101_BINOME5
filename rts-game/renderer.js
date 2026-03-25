export class Renderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.mapImage = null;

        // Camera properties
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1,
            minZoom: 1,
            maxZoom: 5
        };

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    setMapImage(img, game) {
        this.mapImage = img;
        // Calculate min zoom so the map at least fills the screen, or fits within it
        // We'll calculate limits in draw() to keep it simple, but set baseline here
        if (game) {
            const mapWidth = game.gridWidth * game.cellSize;
            const mapHeight = game.gridHeight * game.cellSize;

            const scaleX = this.canvas.width / mapWidth;
            const scaleY = this.canvas.height / mapHeight;

            this.camera.minZoom = Math.max(scaleX, scaleY); // Fill the screen
            this.camera.zoom = this.camera.minZoom;
        }
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    // Convertit les coordonnées de l'écran en coordonnées de monde (avant grille)
    screenToWorld(screenX, screenY) {
        return {
            worldX: (screenX - this.camera.x) / this.camera.zoom,
            worldY: (screenY - this.camera.y) / this.camera.zoom
        };
    }

    // Convertit les coordonnées de l'écran en coordonnées de grille
    screenToGrid(screenX, screenY, cellSize) {
        const { worldX, worldY } = this.screenToWorld(screenX, screenY);
        return {
            gridX: Math.floor(worldX / cellSize),
            gridY: Math.floor(worldY / cellSize)
        };
    }

    // Contraint la caméra pour ne pas sortir de la carte
    constrainCamera(game) {
        const mapWidth = game.gridWidth * game.cellSize * this.camera.zoom;
        const mapHeight = game.gridHeight * game.cellSize * this.camera.zoom;

        // Limiter le x
        if (mapWidth < this.canvas.width) {
            // Si la carte est plus petite que l'écran (zoom arrière max), centrer
            this.camera.x = (this.canvas.width - mapWidth) / 2;
        } else {
            // Empêcher de voir le vide à gauche et à droite
            this.camera.x = Math.min(0, Math.max(this.canvas.width - mapWidth, this.camera.x));
        }

        // Limiter le y
        if (mapHeight < this.canvas.height) {
            // Si la carte est plus petite que l'écran, centrer
            this.camera.y = (this.canvas.height - mapHeight) / 2;
        } else {
            // Empêcher de voir le vide en haut et en bas
            this.camera.y = Math.min(0, Math.max(this.canvas.height - mapHeight, this.camera.y));
        }
    }

    clear() {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform to clear the whole canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#1e3752'; // Eau (gris foncé / bleu) - fallback
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }

    // Dessine l'état du jeu (la grille logic)
    draw(game) {
        this.clear();

        if (!game.mapLoaded || !this.mapImage) {
            this.ctx.save();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText("Chargement de la carte...", this.canvas.width/2, this.canvas.height/2);
            this.ctx.restore();
            return;
        }

        this.constrainCamera(game);

        this.ctx.save();
        // Appliquer la transformation de la caméra
        this.ctx.translate(this.camera.x, this.camera.y);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);

        // Dessiner l'image de la carte en fond
        // L'image map.png a une taille qui a déterminé gridWidth/gridHeight
        this.ctx.drawImage(this.mapImage, 0, 0, game.gridWidth * game.cellSize, game.gridHeight * game.cellSize);

        const cellSize = game.cellSize;

        // Optimisation : ne dessiner que ce qui est visible à l'écran (Culling)
        // Coordonnées monde du coin en haut à gauche visible
        const startX = Math.max(0, Math.floor(-this.camera.x / (this.camera.zoom * cellSize)));
        const startY = Math.max(0, Math.floor(-this.camera.y / (this.camera.zoom * cellSize)));

        // Coordonnées monde du coin en bas à droite visible
        const endX = Math.min(game.gridWidth, Math.ceil((this.canvas.width - this.camera.x) / (this.camera.zoom * cellSize)));
        const endY = Math.min(game.gridHeight, Math.ceil((this.canvas.height - this.camera.y) / (this.camera.zoom * cellSize)));

        // Dessiner uniquement les entités par dessus dans la zone visible
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const cell = game.grid[y][x];

                // On ne dessine que les cellules contrôlées
                if (cell.owner !== null) {
                    const entity = game.entities[cell.owner];
                    if (entity) {
                        this.ctx.fillStyle = entity.color;
                        if (!cell.isLand) {
                            // Pour la mer, on dessine en semi-transparent ou on fait un motif
                            this.ctx.globalAlpha = 0.5;
                            this.ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                            this.ctx.globalAlpha = 1.0;
                        } else {
                            this.ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                        }

                        // Dessiner la ville par dessus
                        if (cell.hasCity) {
                            this.ctx.fillStyle = '#ffffff'; // Blanc ou icône
                            this.ctx.beginPath();
                            this.ctx.arc(
                                x * cellSize + cellSize / 2,
                                y * cellSize + cellSize / 2,
                                cellSize / 2 * 0.8,
                                0,
                                Math.PI * 2
                            );
                            this.ctx.fill();
                            // Contour noir
                            this.ctx.strokeStyle = '#000000';
                            this.ctx.lineWidth = 1;
                            this.ctx.stroke();
                        }
                    }
                }
            }
        }

        this.ctx.restore();
    }
}
