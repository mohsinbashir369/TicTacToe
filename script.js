const cells = document.querySelectorAll('.cell');
const messageElement = document.getElementById('message');
const modeSelection = document.getElementById('mode-selection');
const difficultySelection = document.getElementById('difficulty-selection');
const gameContainer = document.getElementById('game-container');
const playAgainBtn = document.getElementById('play-again-btn');

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

function startGame() {
    // Ensure all cells have the click listener enabled for a fresh start
    cells.forEach(cell => cell.addEventListener('click', handleCellClick, { once: true }));
    messageElement.innerText = `Player ${currentPlayer}'s Turn`;
    playAgainBtn.classList.add('hidden'); // Hide Play Again at start

    // If starting in CPU mode, check if the computer (O) should go first
    if (gameMode.startsWith('CPU') && currentPlayer === 'O' && isGameActive) {
        setTimeout(computerMove, 500);
    }
}

window.playAgain = function() {
    // Reset board state and turns
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X'; // Player X always starts the match
    isGameActive = true;
    
    // Clear board UI
    cells.forEach(cell => {
        cell.innerText = '';
        cell.classList.remove('X', 'O', 'win');
        cell.addEventListener('click', handleCellClick, { once: true });
    });
    
    startGame();
}

window.resetGame = function() {
    // Reset all game variables
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    isGameActive = true;
    gameMode = null;
    
    // Clear the board UI
    cells.forEach(cell => {
        cell.innerText = '';
        cell.classList.remove('X', 'O', 'win');
        cell.removeEventListener('click', handleCellClick);
    });

    // Go back to the mode selection screen
    gameContainer.classList.add('hidden');
    difficultySelection.classList.add('hidden');
    modeSelection.classList.remove('hidden');
    messageElement.innerText = "Select Game Mode";
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
        // Delay the computer's move
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
        isGameActive = false;
        // Display winner message on screen
        messageElement.innerText = `Player ${currentPlayer} Wins! 🎉`;
        playAgainBtn.classList.remove('hidden'); // Show Play Again button
        return true;
    }

    // Check for Draw
    if (!board.includes('')) {
        isGameActive = false;
        // Display draw message on screen
        messageElement.innerText = 'It\'s a Draw! 🤝';
        playAgainBtn.classList.remove('hidden'); // Show Play Again button
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
        moveIndex = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        
    } else if (gameMode === 'CPU_HARD') {
        
        moveIndex = findMoveToWin(currentPlayer); 
        
        if (moveIndex === undefined) {
            moveIndex = findMoveToWin('X');
        }

        if (moveIndex === undefined) {
            if (availableMoves.includes(4)) {
                moveIndex = 4;
            } else {
                const corners = [0, 2, 6, 8].filter(index => availableMoves.includes(index));
                if (corners.length > 0) {
                    moveIndex = corners[Math.floor(Math.random() * corners.length)];
                } else {
                    moveIndex = availableMoves[Math.floor(Math.random() * availableMoves.length)];
                }
            }
        }
    }

    if (moveIndex !== undefined && isGameActive) {
        cells[moveIndex].removeEventListener('click', handleCellClick);
        
        placeMark(cells[moveIndex], moveIndex);
        
        if (checkResult()) return;
        
        changePlayer();
    }
}

function findMoveToWin(mark) {
    for (let i = 0; i < WINNING_CONDITIONS.length; i++) {
        const [a, b, c] = WINNING_CONDITIONS[i];
        const line = [board[a], board[b], board[c]];
        
        const markCount = line.filter(val => val === mark).length;
        const emptyIndex = line.findIndex(val => val === '');

        if (markCount === 2 && emptyIndex !== -1) {
            const indexToWin = WINNING_CONDITIONS[i][emptyIndex];
            return indexToWin;
        }
    }
    return undefined;
}