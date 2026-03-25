import sys

def modify_game():
    with open('rts-game/game.js', 'r') as f:
        content = f.read()

    old_code = """    // Calcule la défense de chaque cellule à chaque tick
    updateDefenses() {
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const cell = this.grid[y][x];
                if (cell.owner !== null) {
                    const entity = this.entities[cell.owner];
                    if (entity && entity.cellsControlled > 0) {
                        // Répartition simple : défense = troupes totales / nombre de cellules TERRESTRES
                        if (cell.isLand) {
                            cell.defense = Math.max(1, Math.floor(entity.troops / entity.cellsControlled));
                            if (cell.hasCity) {
                                cell.defense *= 2; // Les villes doublent la défense
                            }
                        } else {
                            // 1-to-1 combat sur l'océan
                            cell.defense = 1;
                        }
                    } else if (entity && !cell.isLand) {
                        cell.defense = 1;
                    }
                } else {
                    cell.defense = 0; // Neutre
                }
            }
        }
    }"""

    new_code = """    // Calcule la défense de chaque cellule à chaque tick
    updateDefenses() {
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const cell = this.grid[y][x];
                if (cell.owner !== null) {
                    const entity = this.entities[cell.owner];
                    if (entity && entity.cellsControlled > 0) {
                        // Répartition simple : défense = troupes totales / nombre de cellules TERRESTRES
                        if (cell.isLand) {
                            cell.defense = Math.max(1, Math.floor(entity.troops / entity.cellsControlled));
                        } else {
                            // 1-to-1 combat sur l'océan
                            cell.defense = 1;
                        }
                    } else if (entity && !cell.isLand) {
                        cell.defense = 1;
                    }
                } else {
                    cell.defense = 0; // Neutre
                }
            }
        }

        // Appliquer le bonus des villes (rayon de 4 cellules)
        for (const id in this.entities) {
            const entity = this.entities[id];
            for (const city of entity.cities) {
                const radius = 4;
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const nx = city.x + dx;
                        const ny = city.y + dy;

                        // Si on est dans les limites de la grille et approximativement dans un cercle
                        if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight && (dx*dx + dy*dy) <= radius*radius) {
                            const nCell = this.grid[ny][nx];
                            // Le bonus s'applique aux cellules terrestres du propriétaire
                            if (nCell.owner === id && nCell.isLand) {
                                nCell.defense *= 2; // Double la défense dans le rayon
                            }
                        }
                    }
                }
            }
        }
    }"""

    if old_code in content:
        content = content.replace(old_code, new_code)
        with open('rts-game/game.js', 'w') as f:
            f.write(content)
        print("Patched successfully!")
    else:
        print("Could not find the block to replace!")

modify_game()
