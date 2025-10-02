const boardElement = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const messageElement = document.getElementById('message');
const modeSelection = document.getElementById('mode-selection');
const difficultySelection = document.getElementById('difficulty-selection');
const gameContainer = document.getElementById('game-container');

let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let isGameActive = true;
let gameMode = null; // '2P', 'CPU_EASY', or 'CPU_HARD'

const WINNING_CONDITIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

// --- UI / Mode Management ---

function showDifficulty() {
    modeSelection.classList.add('hidden');
    difficultySelection.classList.remove('hidden');
}

function setMode(mode) {
    gameMode = mode;
    difficultySelection.classList.add('hidden');
    modeSelection.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    startGame();
}

function resetGame() {
    // Reset all game variables
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    isGameActive = true;
    gameMode = null;
    
    // Clear the board UI
    cells.forEach(cell => {
        cell.innerText = '';
        cell.classList.remove('X', 'O', 'win');
        cell.addEventListener('click', handleCellClick, { once: true });
    });

    // Go back to the mode selection screen
    gameContainer.classList.add('hidden');
    difficultySelection.classList.add('hidden');
    modeSelection.classList.remove('hidden');
    messageElement.innerText = "Select Game Mode";
}

function startGame() {
    cells.forEach(cell => cell.addEventListener('click', handleCellClick, { once: true }));
    messageElement.innerText = `Player ${currentPlayer}'s Turn`;
}


// --- Game Logic ---

function handleCellClick(e) {
    const clickedCell = e.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

    if (board[clickedCellIndex] !== '' || !isGameActive) {
        return;
    }

    placeMark(clickedCell, clickedCellIndex);
    
    if (checkResult()) return;
    
    changePlayer();

    if (gameMode.startsWith('CPU') && currentPlayer === 'O' && isGameActive) {
        // Delay the computer's move for a better user experience
        setTimeout(computerMove, 500);
    }
}

function placeMark(cell, index) {
    board[index] = currentPlayer;
    cell.innerText = currentPlayer;
    cell.classList.add(currentPlayer);
}

function changePlayer() {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    messageElement.innerText = `Player ${currentPlayer}'s Turn`;
}

function checkResult() {
    let roundWon = false;
    for (let i = 0; i < WINNING_CONDITIONS.length; i++) {
        const winCondition = WINNING_CONDITIONS[i];
        let a = board[winCondition[0]];
        let b = board[winCondition[1]];
        let c = board[winCondition[2]];

        if (a === '' || b === '' || c === '') continue;

        if (a === b && b === c) {
            roundWon = true;
            // Highlight winning cells
            winCondition.forEach(index => cells[index].classList.add('win'));
            break;
        }
    }

    if (roundWon) {
        messageElement.innerText = `Player ${currentPlayer} Wins!`;
        isGameActive = false;
        return true;
    }

    // Check for Draw
    if (!board.includes('')) {
        messageElement.innerText = 'It\'s a Draw!';
        isGameActive = false;
        return true;
    }
    
    return false;
}

// --- Computer AI Logic ---

function getAvailableMoves() {
    return board.map((cell, index) => cell === '' ? index : null).filter(index => index !== null);
}

function computerMove() {
    const availableMoves = getAvailableMoves();
    let moveIndex;

    if (gameMode === 'CPU_EASY') {
        // EASY: Pick a random available spot
        moveIndex = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        
    } else if (gameMode === 'CPU_HARD') {
        // HARD: Simple blocking/winning logic (unbeatable in most scenarios)
        
        // 1. Check for a winning move (where O can win)
        moveIndex = findMoveToWin(currentPlayer);
        
        // 2. If no winning move, check to block the opponent's winning move (where X can win)
        if (moveIndex === undefined) {
            moveIndex = findMoveToWin('X');
        }

        // 3. If no win or block, take the center (4), then a corner (0, 2, 6, 8)
        if (moveIndex === undefined) {
            if (availableMoves.includes(4)) {
                moveIndex = 4;
            } else {
                const corners = [0, 2, 6, 8].filter(index => availableMoves.includes(index));
                if (corners.length > 0) {
                    moveIndex = corners[Math.floor(Math.random() * corners.length)];
                } else {
                    // Fallback to random if all priority spots are taken
                    moveIndex = availableMoves[Math.floor(Math.random() * availableMoves.length)];
                }
            }
        }
    }

    // Execute the computer's move
    if (moveIndex !== undefined && isGameActive) {
        // Remove the one-time click listener before placing the mark
        cells[moveIndex].removeEventListener('click', handleCellClick);
        
        placeMark(cells[moveIndex], moveIndex);
        
        if (checkResult()) return;
        
        changePlayer();
    }
}

/**
 * Checks if a player (mark) can win in the next move and returns the index.
 * @param {string} mark - The player mark ('X' or 'O') to check for.
 * @returns {number|undefined} The winning index or undefined.
 */
function findMoveToWin(mark) {
    for (let i = 0; i < WINNING_CONDITIONS.length; i++) {
        const [a, b, c] = WINNING_CONDITIONS[i];
        const line = [board[a], board[b], board[c]];
        
        // Check if the line has exactly two of the current mark and one empty spot
        const markCount = line.filter(val => val === mark).length;
        const emptyIndex = line.findIndex(val => val === '');

        if (markCount === 2 && emptyIndex !== -1) {
            // Found a winning/blocking move
            const indexToWin = WINNING_CONDITIONS[i][emptyIndex];
            return indexToWin;
        }
    }
    return undefined;
}