document.addEventListener('DOMContentLoaded', () => {
            // Game constants
            const COLS = 10;
            const ROWS = 20;
            const EMPTY = 'empty';
            
            // Game elements
            const grid = document.getElementById('game-grid');
            const scoreElement = document.getElementById('score');
            const levelElement = document.getElementById('level');
            const linesElement = document.getElementById('lines');
            const startBtn = document.getElementById('start-btn');
            const pauseBtn = document.getElementById('pause-btn');
            const resetBtn = document.getElementById('reset-btn');
            const gameOverScreen = document.getElementById('game-over');
            const finalScoreElement = document.getElementById('final-score');
            const restartBtn = document.getElementById('restart-btn');
            
            // Game state
            let gameBoard = [];
            let currentPiece = null;
            let nextPiece = null;
            let score = 0;
            let level = 1;
            let lines = 0;
            let gameInterval = null;
            let isPaused = false;
            let isGameOver = false;
            let dropCounter = 0;
            let dropInterval = 1000; // milliseconds
            
            // Tetromino shapes
            const SHAPES = [
                { name: 'I', color: 'I', shape: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]] },
                { name: 'O', color: 'O', shape: [[1,1], [1,1]] },
                { name: 'T', color: 'T', shape: [[0,1,0], [1,1,1], [0,0,0]] },
                { name: 'S', color: 'S', shape: [[0,1,1], [1,1,0], [0,0,0]] },
                { name: 'Z', color: 'Z', shape: [[1,1,0], [0,1,1], [0,0,0]] },
                { name: 'J', color: 'J', shape: [[1,0,0], [1,1,1], [0,0,0]] },
                { name: 'L', color: 'L', shape: [[0,0,1], [1,1,1], [0,0,0]] }
            ];
            
            // Initialize the game
            function init() {
                createGrid();
                resetGame();
                setupEventListeners();
            }
            
            // Create the game grid
            function createGrid() {
                grid.innerHTML = '';
                
                // Create game grid
                for (let row = 0; row < ROWS; row++) {
                    for (let col = 0; col < COLS; col++) {
                        const cell = document.createElement('div');
                        cell.classList.add('grid-cell');
                        cell.dataset.row = row;
                        cell.dataset.col = col;
                        grid.appendChild(cell);
                    }
                }
            }
            
            // Reset game state
            function resetGame() {
                // Reset game board
                gameBoard = Array(ROWS).fill().map(() => Array(COLS).fill(EMPTY));
                
                // Reset game state
                score = 0;
                level = 1;
                lines = 0;
                dropCounter = 0;
                dropInterval = 1000;
                isPaused = false;
                isGameOver = false;
                
                // Update UI
                scoreElement.textContent = score;
                levelElement.textContent = level;
                linesElement.textContent = lines;
                pauseBtn.disabled = true;
                pauseBtn.textContent = 'Pause Game';
                startBtn.textContent = 'Start Game';
                gameOverScreen.style.display = 'none';
                
                // Clear grid
                document.querySelectorAll('.grid-cell').forEach(cell => {
                    cell.classList.remove('filled', 'I', 'O', 'T', 'S', 'Z', 'J', 'L');
                });
                
                // Clear any existing interval
                if (gameInterval) {
                    clearInterval(gameInterval);
                    gameInterval = null;
                }
            }
            
            // Set up event listeners
            function setupEventListeners() {
                startBtn.addEventListener('click', startGame);
                pauseBtn.addEventListener('click', togglePause);
                resetBtn.addEventListener('click', resetGame);
                restartBtn.addEventListener('click', resetGame);
                
                // Keyboard controls
                document.addEventListener('keydown', e => {
                    if (isGameOver || isPaused) return;
                    
                    switch (e.key) {
                        case 'ArrowLeft':
                            movePiece(-1, 0);
                            break;
                        case 'ArrowRight':
                            movePiece(1, 0);
                            break;
                        case 'ArrowDown':
                            movePiece(0, 1);
                            break;
                        case 'ArrowUp':
                            rotatePiece();
                            break;
                        case ' ':
                            hardDrop();
                            break;
                        case 'p':
                        case 'P':
                            togglePause();
                            break;
                    }
                });
            }
            
            // Start the game
            function startGame() {
                if (gameInterval) {
                    clearInterval(gameInterval);
                }
                
                resetGame();
                isGameOver = false;
                pauseBtn.disabled = false;
                startBtn.textContent = 'Restart Game';
                
                // Create first piece
                nextPiece = getRandomPiece();
                createNewPiece();
                
                // Start game loop
                gameInterval = setInterval(update, 1000/60); // 60fps
            }
            
            // Game update loop
            function update() {
                if (isPaused || isGameOver) return;
                
                dropCounter += 1000/60; // Approximate milliseconds per frame
                
                if (dropCounter > dropInterval) {
                    dropPiece();
                    dropCounter = 0;
                }
                
                draw();
            }
            
            // Create a new piece
            function createNewPiece() {
                currentPiece = nextPiece;
                nextPiece = getRandomPiece();
                
                // Position the new piece at the top center
                currentPiece.x = Math.floor(COLS / 2) - Math.floor(currentPiece.shape[0].length / 2);
                currentPiece.y = 0;
                
                // Check for game over
                if (checkCollision(0, 0)) {
                    gameOver();
                    return;
                }
            }
            
            // Get a random tetromino piece
            function getRandomPiece() {
                const piece = {...SHAPES[Math.floor(Math.random() * SHAPES.length)]};
                piece.shape = piece.shape.map(row => [...row]); // Deep copy
                return piece;
            }
            
            // Draw the game state
            function draw() {
                // Clear the grid
                document.querySelectorAll('.grid-cell').forEach(cell => {
                    cell.classList.remove('filled', 'I', 'O', 'T', 'S', 'Z', 'J', 'L');
                });
                
                // Draw locked pieces
                for (let row = 0; row < ROWS; row++) {
                    for (let col = 0; col < COLS; col++) {
                        if (gameBoard[row][col] !== EMPTY) {
                            const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
                            cell.classList.add('filled', gameBoard[row][col]);
                        }
                    }
                }
                
                // Draw current piece
                if (currentPiece) {
                    for (let row = 0; row < currentPiece.shape.length; row++) {
                        for (let col = 0; col < currentPiece.shape[row].length; col++) {
                            if (currentPiece.shape[row][col]) {
                                const y = currentPiece.y + row;
                                const x = currentPiece.x + col;
                                
                                if (y >= 0) { // Only draw if within visible area
                                    const cell = document.querySelector(`.grid-cell[data-row="${y}"][data-col="${x}"]`);
                                    if (cell) {
                                        cell.classList.add('filled', currentPiece.color);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            // Move the current piece
            function movePiece(dx, dy) {
                if (!currentPiece) return;
                
                currentPiece.x += dx;
                currentPiece.y += dy;
                
                if (checkCollision()) {
                    currentPiece.x -= dx;
                    currentPiece.y -= dy;
                    
                    // If we moved down and collided, lock the piece
                    if (dy > 0) {
                        lockPiece();
                        clearLines();
                        createNewPiece();
                    }
                }
            }
            
            // Rotate the current piece
            function rotatePiece() {
                if (!currentPiece) return;
                
                // Store original shape
                const originalShape = currentPiece.shape;
                
                // Create a new rotated shape
                const rows = originalShape.length;
                const cols = originalShape[0].length;
                
                const newShape = Array(cols).fill().map(() => Array(rows).fill(0));
                
                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        newShape[col][rows - 1 - row] = originalShape[row][col];
                    }
                }
                
                // Try the rotated shape
                currentPiece.shape = newShape;
                
                // If rotation causes collision, revert
                if (checkCollision()) {
                    currentPiece.shape = originalShape;
                }
            }
            
            // Hard drop - instantly drop the piece
            function hardDrop() {
                if (!currentPiece) return;
                
                while (!checkCollision(0, 1)) {
                    currentPiece.y++;
                }
                
                lockPiece();
                clearLines();
                createNewPiece();
            }
            
            // Drop the piece by one row (automatic movement)
            function dropPiece() {
                movePiece(0, 1);
            }
            
            // Check for collisions
            function checkCollision(dx = 0, dy = 0) {
                if (!currentPiece) return false;
                
                for (let row = 0; row < currentPiece.shape.length; row++) {
                    for (let col = 0; col < currentPiece.shape[row].length; col++) {
                        if (!currentPiece.shape[row][col]) continue;
                        
                        const newY = currentPiece.y + row + dy;
                        const newX = currentPiece.x + col + dx;
                        
                        // Check boundaries
                        if (newX < 0 || newX >= COLS || newY >= ROWS) {
                            return true;
                        }
                        
                        // Check for collision with locked pieces
                        if (newY >= 0 && gameBoard[newY][newX] !== EMPTY) {
                            return true;
                        }
                    }
                }
                
                return false;
            }
            
            // Lock the current piece to the board
            function lockPiece() {
                for (let row = 0; row < currentPiece.shape.length; row++) {
                    for (let col = 0; col < currentPiece.shape[row].length; col++) {
                        if (!currentPiece.shape[row][col]) continue;
                        
                        const y = currentPiece.y + row;
                        const x = currentPiece.x + col;
                        
                        if (y >= 0) { // Only lock if within the board
                            gameBoard[y][x] = currentPiece.color;
                        }
                    }
                }
            }
            
            // Clear completed lines
            function clearLines() {
                let linesCleared = 0;
                
                for (let row = ROWS - 1; row >= 0; row--) {
                    // Check if the row is complete
                    if (gameBoard[row].every(cell => cell !== EMPTY)) {
                        // Remove the completed row
                        gameBoard.splice(row, 1);
                        // Add a new empty row at the top
                        gameBoard.unshift(Array(COLS).fill(EMPTY));
                        linesCleared++;
                        row++; // Recheck the same row index since we removed a row
                    }
                }
                
                if (linesCleared > 0) {
                    // Update score
                    const points = [0, 100, 300, 500, 800]; // Points for 0-4 lines
                    score += points[linesCleared] * level;
                    lines += linesCleared;
                    
                    // Level up every 10 lines
                    level = Math.floor(lines / 10) + 1;
                    
                    // Increase speed with level
                    dropInterval = Math.max(100, 1000 - (level - 1) * 50);
                    
                    // Update UI
                    scoreElement.textContent = score;
                    levelElement.textContent = level;
                    linesElement.textContent = lines;
                }
            }
            
            // Toggle pause state
            function togglePause() {
                isPaused = !isPaused;
                pauseBtn.textContent = isPaused ? 'Resume Game' : 'Pause Game';
            }
            
            // Game over
            function gameOver() {
                isGameOver = true;
                clearInterval(gameInterval);
                gameInterval = null;
                
                finalScoreElement.textContent = score;
                gameOverScreen.style.display = 'flex';
            }
            
            // Initialize the game
            init();
        });
