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

let canvas;
let ctx;
const backgroundImage = new Image();
const paddle_image = new Image();
const ball_image = new Image();

function initializeGame(initialState) {
    canvas = document.getElementById("pongCanvas");
    ctx = canvas.getContext("2d");
    // Canvas background image
    backgroundImage.src = "assets/game/images/pong_backgound.jpg";
    // Paddle images
    paddle_image.src = "assets/game/images/player_pink.png";

    // Wait for the image to load before drawing it on the canvas
    // backgroundImage.onload = function() {
    //     // Draw image
    //     ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    // };
}

function updateGame(gameState) {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Black background
    // ctx.fillStyle = "#000";
    // ctx.fillRect(0, 0, canvas.width, canvas.height);

    //Draw Background
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    for (const playerId in gameState.players) {
        const player = gameState.players[playerId];
        if(player.id === 0)
            drawPaddle(player.paddle_x, player.paddle_y); // Red paddle
        else
            drawPaddle(player.paddle_x, player.paddle_y); // Blue paddle
    }
    drawBall(gameState.ball.x, gameState.ball.y);
}

function drawPaddle(x, y) {
    // // Set neon effect parameters
    // ctx.shadowColor = "#ffffff";
    // ctx.shadowBlur = 20;
    // ctx.lineJoin = "bevel";
    // ctx.lineWidth = 15;
    // ctx.strokeStyle = "#ffffff"; // White
    
    // // Gradient to simulate neon effect
    // var gradient = ctx.createLinearGradient(x, y, x + 10, y + 40);
    // gradient.addColorStop(0, color); // Base color
    // gradient.addColorStop(1, "#fff"); // White color for neon effect
    
    // // Draw paddle
    // ctx.fillStyle = gradient;
    // ctx.fillRect(x, y, 10, 40);
    
    // // Reset shadow
    // ctx.shadowColor = "transparent";
    // ctx.shadowBlur = 0;

    // The image it's a sprite see https://www.w3schools.com/TAgs/canvas_drawimage.asp
    ctx.drawImage(paddle_image, 0, 0, 70, 200, x, y, 22, 89);
    


}

function drawBall(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffff";
    ctx.fill();
    ctx.closePath();
}

/*
function drawBall(x, y) {
    // Set neon effect
    ctx.shadowColor = "#d53";
    ctx.shadowBlur = 20;
    ctx.lineJoin = "bevel";
    ctx.lineWidth = 15;
    ctx.strokeStyle = "#38f";
    
    // Draw Ball
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();
    
    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
}
*/

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