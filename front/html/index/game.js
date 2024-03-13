import { GameSocketManager } from "../socket/GameSocketManager.js"
import { GAME_TYPES, SOCKET } from '../socket/Constants.js';

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
}

function InitMatchmaking()
{
    gameSM.send(GAME_TYPES.INITMATCHMAKING);
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
    //Game matched! start game
    initializeGame(data.message)
});

gameSM.registerCallback(GAME_TYPES.CANCELMATCHMAKING, data => {
    
});

gameSM.registerCallback(GAME_TYPES.INQUEUE, data => {
    console.log(data.message);
});

gameSM.registerCallback(GAME_TYPES.GAME_STATE, data => {
    updateGame(data.message);
});

////////////////
// GAME LOGIC //
////////////////

let canvas;
let ctx;

function initializeGame(initialState) {
    canvas = document.getElementById("pongCanvas");
	ctx = canvas.getContext("2d");
}

function updateGame(gameState) {
    // Example: Draw paddles and ball
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const playerId in gameState.players) {
        const player = gameState.players[playerId];
        drawPaddle(player.paddle_x, player.paddle_y);
    }
    drawBall(gameState.ball.x, gameState.ball.y);
}

function drawPaddle(x, y) {
    ctx.fillStyle = "#000";
    ctx.fillRect(x, y, 10, 40);
}

function drawBall(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.closePath();
}

// Event listener detect keys
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
let direction = null;

function handleKeyDown(event) {
    direction = getDirectionFromKeyCode(event.keyCode);
    if (direction) {
        // Send key event to server
        sendDirectionToServer();
    }
}

function handleKeyUp(event) {
    direction = null;  // When release, set direction as null
}

function sendDirectionToServer() {
    if (direction) {
        // Send direction

        gameSM.send(GAME_TYPES.DIRECTION, direction);

        // Schedule the next update while the key is pressed
        requestAnimationFrame(sendDirectionToServer);
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