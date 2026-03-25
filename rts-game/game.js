export class Game {
    constructor(canvasWidth, canvasHeight) {
        this.cellSize = 10; // 10x10 pixels par cellule
        this.gridWidth = Math.ceil(canvasWidth / this.cellSize);
        this.gridHeight = Math.ceil(canvasHeight / this.cellSize);

        // La grille de jeu (tableau 2D)
        this.grid = [];
        this.initGrid();

        // Le joueur local
        this.player = {
            id: 'player1',
            color: '#3498db', // Bleu
            troops: 100,
            cellsControlled: 1, // Au départ, 1 capitale
            attackPercent: 50 // 50% par défaut
        };

        // Liste des cellules contrôlées (pour optimisation)
        this.controlledCells = [];

        // Apparition du joueur (au centre de l'écran)
        const startX = Math.floor(this.gridWidth / 2);
        const startY = Math.floor(this.gridHeight / 2);

        this.grid[startY][startX].owner = this.player.id;
        this.controlledCells.push({ x: startX, y: startY });

        // Ticks de génération
        this.lastTickTime = performance.now();
        this.tickRate = 1000; // 1000ms = 1 seconde

        // Mécanique d'expansion
        this.expansions = []; // Liste des expansions en cours
        this.expansionSpeed = 50; // Millisecondes par étape d'expansion
    }

    initGrid() {
        for (let y = 0; y < this.gridHeight; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                this.grid[y][x] = {
                    owner: null, // 'player1' ou null
                    x: x,
                    y: y
                };
            }
        }
    }

    updateDimensions(width, height) {
        // Optionnel
    }

    setAttackPercent(percent) {
        this.player.attackPercent = percent;
    }

    attack(targetX, targetY) {
        if (targetX < 0 || targetX >= this.gridWidth || targetY < 0 || targetY >= this.gridHeight) return;

        const troopsToSend = Math.floor(this.player.troops * (this.player.attackPercent / 100));
        if (troopsToSend <= 0) return;

        this.player.troops -= troopsToSend;

        const startCell = this.findClosestBorderCell(targetX, targetY);

        if (startCell) {
            this.expansions.push(new Expansion(this, startCell.x, startCell.y, targetX, targetY, troopsToSend));
        }
    }

    findClosestBorderCell(targetX, targetY) {
        let closestCell = null;
        let minDistance = Infinity;

        for (const cell of this.controlledCells) {
            const neighbors = this.getNeighbors(cell.x, cell.y);
            let isBorder = false;

            for (const n of neighbors) {
                if (this.grid[n.y][n.x].owner !== this.player.id) {
                    isBorder = true;
                    break;
                }
            }

            if (isBorder) {
                const dx = cell.x - targetX;
                const dy = cell.y - targetY;
                const distanceSq = dx * dx + dy * dy;

                if (distanceSq < minDistance) {
                    minDistance = distanceSq;
                    closestCell = cell;
                }
            }
        }

        return closestCell;
    }

    getNeighbors(x, y) {
        const neighbors = [];
        const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // Haut, Bas, Gauche, Droite

        for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight) {
                neighbors.push({ x: nx, y: ny });
            }
        }
        return neighbors;
    }

    update(currentTime) {
        // 1. Génération des troupes par tick
        if (currentTime - this.lastTickTime >= this.tickRate) {
            this.player.troops += this.player.cellsControlled;
            this.lastTickTime = currentTime;
        }

        // 2. Mise à jour des expansions
        for (let i = this.expansions.length - 1; i >= 0; i--) {
            const exp = this.expansions[i];
            const isFinished = exp.update(currentTime);

            if (isFinished) {
                this.expansions.splice(i, 1);
            }
        }
    }
}

class Expansion {
    constructor(game, startX, startY, targetX, targetY, initialTroops) {
        this.game = game;
        this.targetX = targetX;
        this.targetY = targetY;
        this.remainingTroops = initialTroops;

        this.lastStepTime = performance.now();
        this.stepDelay = game.expansionSpeed;

        this.frontier = [];
        this.visited = new Set();

        // Initialiser la frontière avec les voisins neutres immédiats de la cellule de départ
        const neighbors = this.game.getNeighbors(startX, startY);
        for (const n of neighbors) {
             if (this.game.grid[n.y][n.x].owner !== this.game.player.id) {
                 this.frontier.push(n);
                 this.visited.add(`${n.x},${n.y}`);
             }
        }
    }

    update(currentTime) {
        if (this.remainingTroops <= 0 || this.frontier.length === 0) {
            return true;
        }

        if (currentTime - this.lastStepTime >= this.stepDelay) {
            this.step();
            this.lastStepTime = currentTime;
        }

        return false;
    }

    step() {
        this.frontier.sort((a, b) => {
            const distA = Math.pow(a.x - this.targetX, 2) + Math.pow(a.y - this.targetY, 2);
            const distB = Math.pow(b.x - this.targetX, 2) + Math.pow(b.y - this.targetY, 2);
            return distA - distB;
        });

        const current = this.frontier.shift();

        const cell = this.game.grid[current.y][current.x];

        if (cell.owner !== this.game.player.id) {
            cell.owner = this.game.player.id;
            this.game.player.cellsControlled++;
            this.game.controlledCells.push({ x: current.x, y: current.y });

            this.remainingTroops--;
        }

        if (this.remainingTroops <= 0) return;

        const neighbors = this.game.getNeighbors(current.x, current.y);
        for (const n of neighbors) {
            const key = `${n.x},${n.y}`;
            if (!this.visited.has(key)) {
                if (this.game.grid[n.y][n.x].owner !== this.game.player.id) {
                    this.frontier.push(n);
                    this.visited.add(key);
                }
            }
        }
    }
}
