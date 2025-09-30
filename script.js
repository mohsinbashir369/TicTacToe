// --- Game State Variables ---
let gameBoard = ['', '', ['', '', '', '', '', '', ''], '', '', '', '', '', ''];
let currentPlayer = 'X';
let isGameActive = false; 
let gameMode = 'player'; 
let difficulty = 'easy'; 

// --- DOM Elements ---
const cells = document.querySelectorAll('.cell');
const gameStatus = document.getElementById('gameStatus');
const resetButton = document.getElementById('resetButton');
const backButton = document.getElementById('backButton'); // Go Back from game area
const gameModeSelect = document.getElementById('gameMode');
const difficultySelect = document.getElementById('difficulty');
const difficultyGroup = document.getElementById('difficulty-group');
const startGameButton = document.getElementById('startGameButton');
const gameArea = document.getElementById('game-area');
const selectionPanel = document.getElementById('selection-panel');

// Modal Elements
const winnerModal = document.getElementById('winner-modal');
const modalMessage = document.getElementById('modal-message');
const modalNewGameButton = document.getElementById('modal-newgame');
const modalBackButton = document.getElementById('modal-back'); // Go Back from modal

// --- Constants ---
const WINNING_CONDITIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];
const AI_PLAYER = 'O';
const HUMAN_PLAYER = 'X';


// --- UI Flow Control Functions ---

/**
 * Shows the mode selection panel and hides the game board/modal.
 */
const showSelectionPanel = () => {
    gameArea.style.display = 'none';
    winnerModal.style.display = 'none';
    selectionPanel.style.display = 'block';
    isGameActive = false;
    handleRestartGame(false); // Reset game logic only
};

/**
 * Shows the game board and hides the selection panel/modal.
 */
const showGameArea = () => {
    selectionPanel.style.display = 'none';
    winnerModal.style.display = 'none';
    gameArea.style.display = 'block';
    handleRestartGame(true); // Reset game and show status
};

// --- Game Logic ---

/**
 * Resets the game to its initial state.
 */
const handleRestartGame = (updateStatus = true) => {
    gameBoard = ['', '', '', '', '', '', '', '', ''];
    isGameActive = true;
    currentPlayer = HUMAN_PLAYER;

    // Reset UI
    cells.forEach(cell => {
        cell.innerHTML = '';
        cell.classList.remove('x', 'o', 'win');
    });
    
    winnerModal.style.display = 'none';

    if (updateStatus) {
        gameStatus.innerHTML = `Player ${HUMAN_PLAYER}'s Turn`;
        gameStatus.style.color = '#00ff7f';
    }
};

const handleCellPlayed = (clickedCell, clickedCellIndex, player) => {
    gameBoard[clickedCellIndex] = player;
    clickedCell.innerHTML = player;
    clickedCell.classList.add(player.toLowerCase());
};

const checkWin = (board, player) => {
    return WINNING_CONDITIONS.some(condition => {
        return condition.every(index => board[index] === player);
    });
};

const handleResultValidation = () => {
    if (checkWin(gameBoard, currentPlayer)) {
        isGameActive = false;
        
        // Highlight winning cells
        const winningCondition = WINNING_CONDITIONS.find(condition => 
            condition.every(index => gameBoard[index] === currentPlayer)
        );
        if (winningCondition) {
            winningCondition.forEach(index => {
                cells[index].classList.add('win');
            });
        }
        
        // Show Winner Modal
        const color = currentPlayer === HUMAN_PLAYER ? '#00ff7f' : '#ff33cc';
        modalMessage.innerHTML = `Player ${currentPlayer} Wins! 🏆`;
        modalMessage.style.color = color;
        modalMessage.style.textShadow = `0 0 15px ${color}`;
        winnerModal.style.display = 'flex';
        gameStatus.innerHTML = 'Game Over';

        return true;
    }

    if (!gameBoard.includes('')) {
        isGameActive = false;
        
        // Show Draw Modal
        modalMessage.innerHTML = 'Game Draw! 🤝';
        modalMessage.style.color = '#00ffff';
        modalMessage.style.textShadow = '0 0 15px #00ffff';
        winnerModal.style.display = 'flex';
        gameStatus.innerHTML = 'Game Over';

        return true;
    }

    return false;
};

const handlePlayerChange = () => {
    currentPlayer = currentPlayer === HUMAN_PLAYER ? AI_PLAYER : HUMAN_PLAYER;
    gameStatus.innerHTML = `${currentPlayer}'s Turn`;
    gameStatus.style.color = currentPlayer === HUMAN_PLAYER ? '#00ff7f' : '#ff33cc';

    if (isGameActive && gameMode === 'ai' && currentPlayer === AI_PLAYER) {
        setTimeout(handleAIMove, 500);
    }
};

const handleCellClick = (clickedCellEvent) => {
    if (!isGameActive) return;

    const clickedCell = clickedCellEvent.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

    if (gameBoard[clickedCellIndex] !== '' || (gameMode === 'ai' && currentPlayer === AI_PLAYER)) {
        return;
    }

    handleCellPlayed(clickedCell, clickedCellIndex, currentPlayer);
    
    if (!handleResultValidation()) {
        handlePlayerChange();
    }
};


// --- AI Logic (The complexity!) ---

const getAvailableMoves = (board) => {
    return board.map((val, index) => val === '' ? index : null).filter(val => val !== null);
};

// MINIMAX ALGORITHM (FOR HARD DIFFICULTY)
const minimax = (newBoard, player) => {
    const availSpots = getAvailableMoves(newBoard);

    if (checkWin(newBoard, HUMAN_PLAYER)) return { score: -10 };
    if (checkWin(newBoard, AI_PLAYER)) return { score: 10 };
    if (availSpots.length === 0) return { score: 0 };

    const moves = [];

    for (let i = 0; i < availSpots.length; i++) {
        const move = {};
        move.index = availSpots[i];
        newBoard[availSpots[i]] = player;

        if (player === AI_PLAYER) {
            move.score = minimax(newBoard, HUMAN_PLAYER).score;
        } else {
            move.score = minimax(newBoard, AI_PLAYER).score;
        }

        newBoard[availSpots[i]] = ''; // Reset the spot
        moves.push(move);
    }

    let bestMove;
    if (player === AI_PLAYER) {
        let bestScore = -Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    } else { 
        let bestScore = Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    }

    return moves[bestMove];
};

// MEDIUM AI (Block/Attack)
const getMediumMove = (board, player) => {
    const opponent = player === HUMAN_PLAYER ? AI_PLAYER : HUMAN_PLAYER;
    const available = getAvailableMoves(board);

    // 1. Check for immediate winning move
    for (let i = 0; i < available.length; i++) {
        const move = available[i];
        board[move] = player;
        if (checkWin(board, player)) {
            board[move] = '';
            return move;
        }
        board[move] = '';
    }

    // 2. Check for immediate blocking move
    for (let i = 0; i < available.length; i++) {
        const move = available[i];
        board[move] = opponent;
        if (checkWin(board, opponent)) {
            board[move] = '';
            return move;
        }
        board[move] = '';
    }

    // 3. Take the center (4)
    if (board[4] === '') return 4;

    // 4. Take a random corner
    const corners = [0, 2, 6, 8].filter(i => board[i] === '');
    if (corners.length > 0) {
        return corners[Math.floor(Math.random() * corners.length)];
    }

    // 5. Random move
    return available[Math.floor(Math.random() * available.length)];
};


const handleAIMove = () => {
    let moveIndex = -1;
    const available = getAvailableMoves(gameBoard);

    if (available.length === 0) return;

    switch (difficulty) {
        case 'easy':
            moveIndex = available[Math.floor(Math.random() * available.length)];
            break;
        case 'medium':
            moveIndex = getMediumMove(gameBoard, AI_PLAYER);
            break;
        case 'hard':
            const bestMove = minimax(gameBoard, AI_PLAYER);
            moveIndex = bestMove.index;
            break;
    }

    const cellElement = cells[moveIndex];
    handleCellPlayed(cellElement, moveIndex, AI_PLAYER);

    handleResultValidation() || handlePlayerChange();
};


// --- Event Listeners ---

// Update UI on mode selection
gameModeSelect.addEventListener('change', () => {
    gameMode = gameModeSelect.value;
    difficultyGroup.style.display = (gameMode === 'ai') ? 'flex' : 'none';
});

// Update difficulty state
difficultySelect.addEventListener('change', () => {
    difficulty = difficultySelect.value;
});

// Primary navigation buttons
startGameButton.addEventListener('click', showGameArea); // Start
resetButton.addEventListener('click', () => handleRestartGame(true)); // Restart from game area
backButton.addEventListener('click', showSelectionPanel); // Go Back from game area

// Modal buttons
modalNewGameButton.addEventListener('click', showGameArea); // Play Again
modalBackButton.addEventListener('click', showSelectionPanel); // Go Back from modal

// Game board click listener
cells.forEach(cell => cell.addEventListener('click', handleCellClick));

// Initial setup
showSelectionPanel();