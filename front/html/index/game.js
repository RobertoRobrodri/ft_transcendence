import { GameSocketManager } from "../socket/GameSocketManager.js"
import { GAME_TYPES, SOCKET } from '../socket/Constants.js';

/////////////////
// Global vars //
/////////////////
let canvas;
let ctx;

function register() {
    document.getElementById("initmatchmaking").addEventListener("click", InitMatchmaking);
    document.getElementById("cancelmatchmaking").addEventListener("click", CancelMatchmaking);
}

// Singleton socket instance
let gameSM = new GameSocketManager();

export function connectGame()
{
    gameSM.connect();
    register();

    canvas = document.getElementById("pongCanvas");
    ctx = canvas.getContext("2d");

    //when game open, try restore any running game
    gameSM.send(GAME_TYPES.RESTORE_GAME);
}

function InitMatchmaking()
{
    initializeGame()
}

function CancelMatchmaking()
{
    gameSM.send(GAME_TYPES.CANCELMATCHMAKING);
}

// Callback socket connected
gameSM.registerCallback(SOCKET.CONNECTED, event => {

});

// Callback socket disconnected
gameSM.registerCallback(SOCKET.DISCONNECTED, event => {
    
});

// Callback socket error
gameSM.registerCallback(SOCKET.ERROR, event => {
    
});

// MATCHMAKING
gameSM.registerCallback(GAME_TYPES.INITMATCHMAKING, data => {
    //Game matched! game started
    // send ready request after open game, message to ask about ready etc
    gameSM.send(GAME_TYPES.PLAYER_READY);
});

gameSM.registerCallback(GAME_TYPES.CANCELMATCHMAKING, data => {
    
});

gameSM.registerCallback(GAME_TYPES.INQUEUE, data => {
    console.log(data.message);
});

// GAME
gameSM.registerCallback(GAME_TYPES.GAME_STATE, data => {
    updateGame(data.message);
});

gameSM.registerCallback(GAME_TYPES.WALL_COLLISON, data => {
    const audio = new Audio("assets/game/sounds/ball_wall.mp3");
    audio.play();
});


gameSM.registerCallback(GAME_TYPES.PADDLE_COLLISON, data => {
    const audio = new Audio("assets/game/sounds/ball_kick.mp3");
    audio.play();
});

gameSM.registerCallback(GAME_TYPES.GAME_END, data => {
    const audio = new Audio("assets/game/sounds/chipi-chapa.mp3");
    audio.play();
});

gameSM.registerCallback(GAME_TYPES.GAME_SCORE, data => {
    console.log(data)
});


////////////////
// GAME LOGIC //
////////////////

function initializeGame() {
    
    gameSM.send(GAME_TYPES.INITMATCHMAKING);
    
}

function updateGame(gameState) {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Black background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw paddles
    for (const playerId in gameState.players) {
        const player = gameState.players[playerId];
        drawPaddle(player.paddle_x, player.paddle_y);
    }
    // Draw ball
    drawBall(gameState.ball.x, gameState.ball.y);
}

function drawPaddle(x, y) {
    ctx.fillStyle = "#ffff";
    ctx.fillRect(x, y, 10, 40);
}

function drawBall(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffff";
    ctx.fill();
    ctx.closePath();
}

// Event listener detect keys
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
let direction = null;
let isSending = false;

function handleKeyDown(event) {
    if (!isSending) {
        direction = getDirectionFromKeyCode(event.keyCode);
        if (direction) {
            // Set a flag to indicate that we are sending a request
            isSending = true;
            // Send key event to server
            sendDirectionToServer();
        }
    }
}

function handleKeyUp(event) {
    direction = null;  // When release, set direction as null
    isSending = false;  // Reset the flag when key is released
}

function sendDirectionToServer() {
    if (direction) {
        // Send direction
        gameSM.send(GAME_TYPES.DIRECTION, direction);
        // Schedule the next update while the key is pressed
        requestAnimationFrame(sendDirectionToServer);
    } else {
        // Reset the flag when the key is released
        isSending = false;
    }
}

function getDirectionFromKeyCode(keyCode) {
    switch (keyCode) {
        case 38: // UP
            return '-1';
        case 40: // DOWN
            return '1';
        default:
            return null;
    }
}