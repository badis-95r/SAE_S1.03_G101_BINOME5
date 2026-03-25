export class Game {
    constructor(canvasWidth, canvasHeight) {
        this.cellSize = 10; // 10x10 pixels par cellule
        this.gridWidth = Math.ceil(canvasWidth / this.cellSize);
        this.gridHeight = Math.ceil(canvasHeight / this.cellSize);

        this.state = 'SPAWN_SELECTION'; // 'SPAWN_SELECTION' ou 'PLAYING'

        // La grille de jeu (tableau 2D)
        this.grid = [];
        this.landCells = []; // Liste de toutes les cellules de terre (pour le spawn aléatoire)
        this.mapLoaded = false;

        this.entities = {}; // id -> { id, color, troops, cellsControlled, isPlayer, attackPercent, controlledCells }

        // Le joueur local
        this.entities['player1'] = {
            id: 'player1',
            color: '#3498db', // Bleu
            troops: 100,
            cellsControlled: 0,
            attackPercent: 50,
            isPlayer: true,
            controlledCells: []
        };

        this.player = this.entities['player1'];

        // Ticks de génération
        this.lastTickTime = performance.now();
        this.tickRate = 1000; // 1000ms = 1 seconde

        // Mécanique d'expansion
        this.expansions = []; // Liste des expansions en cours
        this.expansionSpeed = 50; // Millisecondes par étape d'expansion
    }

    // Appelé par le main.js une fois l'image chargée
    loadMapFromImage(img) {
        // Redimensionner la grille à la taille de l'image (pour simplifier le mapping sur écran)
        // On pourrait étirer l'image, mais il vaut mieux faire une grille qui s'adapte à l'image
        this.gridWidth = Math.ceil(window.innerWidth / this.cellSize);
        this.gridHeight = Math.ceil(window.innerHeight / this.cellSize);

        const canvas = document.createElement('canvas');
        canvas.width = this.gridWidth;
        canvas.height = this.gridHeight;
        const ctx = canvas.getContext('2d');

        // Dessiner l'image redimensionnée sur le canvas caché
        ctx.drawImage(img, 0, 0, this.gridWidth, this.gridHeight);

        const imageData = ctx.getImageData(0, 0, this.gridWidth, this.gridHeight);
        const data = imageData.data;

        this.grid = [];
        this.landCells = [];

        for (let y = 0; y < this.gridHeight; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                // Obtenir l'index dans le tableau de pixels (RGBA)
                const i = (y * this.gridWidth + x) * 4;
                const r = data[i];
                const g = data[i+1];
                const b = data[i+2];
                // L'image map.png a des continents en noir (ou très sombre) et de l'eau en blanc (ou clair).
                // On considère que si le pixel est sombre (ex: moyenne rgb < 128), c'est de la terre.
                const isLand = ((r + g + b) / 3) < 128;

                this.grid[y][x] = {
                    owner: null,
                    isLand: isLand,
                    x: x,
                    y: y
                };

                if (isLand) {
                    this.landCells.push({x, y});
                }
            }
        }

        this.mapLoaded = true;
        this.spawnBots(4); // Ajouter 4 bots
    }

    spawnBots(numBots) {
        const botColors = ['#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'];

        for (let i = 0; i < numBots; i++) {
            const botId = `bot${i+1}`;
            this.entities[botId] = {
                id: botId,
                color: botColors[i % botColors.length],
                troops: 100,
                cellsControlled: 1,
                attackPercent: 50, // sera changé aléatoirement
                isPlayer: false,
                controlledCells: [],
                lastAttackTime: performance.now(),
                attackInterval: Math.random() * 3000 + 2000 // entre 2 et 5 secondes
            };

            // Trouver un point de spawn aléatoire
            this.spawnEntityRandomly(this.entities[botId]);
        }
    }

    spawnEntityRandomly(entity) {
        if (this.landCells.length === 0) return;

        let spawned = false;
        let attempts = 0;

        while (!spawned && attempts < 100) {
            const randomIndex = Math.floor(Math.random() * this.landCells.length);
            const cellPos = this.landCells[randomIndex];
            const cell = this.grid[cellPos.y][cellPos.x];

            // S'assurer que la cellule est libre
            if (cell.owner === null) {
                cell.owner = entity.id;
                entity.cellsControlled = 1;
                entity.controlledCells.push({x: cell.x, y: cell.y});
                spawned = true;
            }
            attempts++;
        }
    }

    updateDimensions(width, height) {
        // Optionnel
    }

    setAttackPercent(percent) {
        this.player.attackPercent = percent;
    }

    startGame() {
        if (this.player.cellsControlled > 0) {
            this.state = 'PLAYING';
            this.lastTickTime = performance.now();
        }
    }

    setPlayerSpawn(gridX, gridY) {
        if (this.state !== 'SPAWN_SELECTION' || !this.mapLoaded) return false;
        if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) return false;

        const cell = this.grid[gridY][gridX];

        // Autoriser seulement sur la terre et non occupée
        if (!cell.isLand || (cell.owner !== null && cell.owner !== this.player.id)) return false;

        // Si le joueur avait déjà une capitale, on la retire
        if (this.player.controlledCells.length > 0) {
            const oldSpawn = this.player.controlledCells[0];
            this.grid[oldSpawn.y][oldSpawn.x].owner = null;
            this.player.controlledCells = [];
            this.player.cellsControlled = 0;
        }

        // Définir la nouvelle capitale
        cell.owner = this.player.id;
        this.player.cellsControlled = 1;
        this.player.controlledCells.push({x: gridX, y: gridY});

        return true;
    }

    attack(entityId, targetX, targetY) {
        if (this.state !== 'PLAYING') return;
        if (targetX < 0 || targetX >= this.gridWidth || targetY < 0 || targetY >= this.gridHeight) return;

        const entity = this.entities[entityId];
        if (!entity) return;

        const troopsToSend = Math.floor(entity.troops * (entity.attackPercent / 100));
        if (troopsToSend <= 0) return;

        entity.troops -= troopsToSend;

        const startCell = this.findClosestBorderCell(entity, targetX, targetY);

        if (startCell) {
            this.expansions.push(new Expansion(this, entityId, startCell.x, startCell.y, targetX, targetY, troopsToSend));
        }
    }

    findClosestBorderCell(entity, targetX, targetY) {
        let closestCell = null;
        let minDistance = Infinity;

        for (let i = entity.controlledCells.length - 1; i >= 0; i--) {
            const cell = entity.controlledCells[i];

            // Vérifier si l'entité possède toujours cette cellule (nettoyage fainéant)
            if (this.grid[cell.y][cell.x].owner !== entity.id) {
                entity.controlledCells.splice(i, 1);
                continue;
            }

            const neighbors = this.getNeighbors(cell.x, cell.y);
            let isBorder = false;

            for (const n of neighbors) {
                if (this.grid[n.y][n.x].owner !== entity.id && this.grid[n.y][n.x].isLand) {
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
        if (this.state !== 'PLAYING') return;

        // 1. Génération des troupes par tick pour TOUTES les entités
        if (currentTime - this.lastTickTime >= this.tickRate) {
            for (const id in this.entities) {
                const entity = this.entities[id];
                entity.troops += entity.cellsControlled;
            }
            this.lastTickTime = currentTime;
        }

        // 2. Logique des Bots (IA)
        this.updateBots(currentTime);

        // 3. Mise à jour des expansions
        for (let i = this.expansions.length - 1; i >= 0; i--) {
            const exp = this.expansions[i];
            const isFinished = exp.update(currentTime);

            if (isFinished) {
                this.expansions.splice(i, 1);
            }
        }
    }

    updateBots(currentTime) {
        for (const id in this.entities) {
            const bot = this.entities[id];

            if (!bot.isPlayer && bot.cellsControlled > 0) {
                if (currentTime - bot.lastAttackTime >= bot.attackInterval) {
                    // C'est l'heure d'attaquer

                    // Choisir un pourcentage aléatoire (ex: 20% à 80%)
                    bot.attackPercent = Math.floor(Math.random() * 60) + 20;

                    // Trouver une cible proche (cellule terrestre n'appartenant pas au bot)
                    const target = this.findRandomTargetNear(bot);

                    if (target) {
                        this.attack(bot.id, target.x, target.y);
                    }

                    bot.lastAttackTime = currentTime;
                    // Prochaine attaque entre 2s et 5s
                    bot.attackInterval = Math.random() * 3000 + 2000;
                }
            }
        }
    }

    findRandomTargetNear(entity) {
        if (entity.controlledCells.length === 0) return null;

        // Sélectionner une cellule de bordure du bot au hasard
        const borderCells = [];
        for (let i = entity.controlledCells.length - 1; i >= 0; i--) {
            const cell = entity.controlledCells[i];

            // Vérifier si l'entité possède toujours cette cellule
            if (this.grid[cell.y][cell.x].owner !== entity.id) {
                entity.controlledCells.splice(i, 1);
                continue;
            }

            const neighbors = this.getNeighbors(cell.x, cell.y);
            let isBorder = false;
            for (const n of neighbors) {
                const nCell = this.grid[n.y][n.x];
                if (nCell.isLand && nCell.owner !== entity.id) {
                    isBorder = true;
                    break;
                }
            }
            if (isBorder) {
                borderCells.push(cell);
            }
        }

        if (borderCells.length === 0) return null;

        const startCell = borderCells[Math.floor(Math.random() * borderCells.length)];

        // Chercher une cellule terrestre cible dans un rayon proche (ex: 5-15 cases)
        const radius = Math.floor(Math.random() * 10) + 5;
        const angle = Math.random() * Math.PI * 2;

        const targetX = Math.floor(startCell.x + Math.cos(angle) * radius);
        const targetY = Math.floor(startCell.y + Math.sin(angle) * radius);

        if (targetX >= 0 && targetX < this.gridWidth && targetY >= 0 && targetY < this.gridHeight) {
            if (this.grid[targetY][targetX].isLand) {
                return { x: targetX, y: targetY };
            }
        }

        return null;
    }
}

class Expansion {
    constructor(game, entityId, startX, startY, targetX, targetY, initialTroops) {
        this.game = game;
        this.entityId = entityId;
        this.targetX = targetX;
        this.targetY = targetY;
        this.remainingTroops = initialTroops;

        this.lastStepTime = performance.now();
        this.stepDelay = game.expansionSpeed;

        this.frontier = [];
        this.visited = new Set();

        // Initialiser la frontière avec les voisins valides
        const neighbors = this.game.getNeighbors(startX, startY);
        for (const n of neighbors) {
             const cell = this.game.grid[n.y][n.x];
             if (cell.isLand && cell.owner !== this.entityId) {
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
        const entity = this.game.entities[this.entityId];

        // Gérer le combat si la cellule appartient à un autre joueur
        if (cell.owner !== null && cell.owner !== this.entityId) {
            // Simplification: le dernier arrivé vole la case,
            // on enlève la case à l'ancien propriétaire.
            const oldOwner = this.game.entities[cell.owner];
            if (oldOwner) {
                oldOwner.cellsControlled = Math.max(0, oldOwner.cellsControlled - 1);
                // On pourrait enlever de la liste controlledCells mais c'est lourd (filter),
                // on vérifie la propriété lors des parcours de bordure plutôt.
            }
        }

        if (cell.owner !== this.entityId) {
            cell.owner = this.entityId;
            entity.cellsControlled++;
            entity.controlledCells.push({ x: current.x, y: current.y });

            this.remainingTroops--;
        }

        if (this.remainingTroops <= 0) return;

        const neighbors = this.game.getNeighbors(current.x, current.y);
        for (const n of neighbors) {
            const key = `${n.x},${n.y}`;
            if (!this.visited.has(key)) {
                const nCell = this.game.grid[n.y][n.x];
                // On ne s'étend que sur la terre
                if (nCell.isLand && nCell.owner !== this.entityId) {
                    this.frontier.push(n);
                    this.visited.add(key);
                }
            }
        }
    }
}
