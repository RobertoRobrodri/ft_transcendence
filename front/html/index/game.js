import { GameSocketManager } from "../socket/GameSocketManager.js"
import { GAME_TYPES, SOCKET } from '../socket/Constants.js';
import { PongAI } from './PongAI.js';

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
}

// Callback socket connected
gameSM.registerCallback(SOCKET.CONNECTED, event => {
    //when game open, try restore any running game, i put here for test
    gameSM.send(GAME_TYPES.RESTORE_GAME);
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
    console.log(data);
});

// GAME
gameSM.registerCallback(GAME_TYPES.GAME_STATE, data => {
    updateGame(data);
});

gameSM.registerCallback(GAME_TYPES.WALL_COLLISON, data => {
    //const audio = new Audio("assets/game/sounds/ball_wall.mp3");
    //audio.play();
});


gameSM.registerCallback(GAME_TYPES.PADDLE_COLLISON, data => {
    //const audio = new Audio("assets/game/sounds/ball_kick.mp3");
    //audio.play();

});

gameSM.registerCallback(GAME_TYPES.GAME_END, data => {
    //const audio = new Audio("assets/game/sounds/chipi-chapa.mp3");
    //audio.play();
});

let score1 = 0;
gameSM.registerCallback(GAME_TYPES.GAME_SCORE, data => {
    console.log(data)
    ai.setPrevBall(null, null);
});




////////////////
// GAME LOGIC //
////////////////

const ai = new PongAI(true); //false: use trained weights, true: train new model
let paddle_height = 40;
let canvasHeight = 200;
let canvasWidth = 400;

function InitMatchmaking()
{
    gameSM.send(GAME_TYPES.INITMATCHMAKING);
}

function CancelMatchmaking()
{
    gameSM.send(GAME_TYPES.CANCELMATCHMAKING);
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

    // process AI (RNA or algorithm)
    var rival = document.getElementById("dstUser").value;
    for (const playerId in gameState.players) {
        const player = gameState.players[playerId];
        if (player.userid != rival)
        {
            if(rival == "1")
            {
                // RNA
                let direction = ai.process(gameState.ball.x, gameState.ball.y, player.paddle_y, paddle_height, canvasHeight, canvasWidth, 0, 5);
                if(direction == 0)
                    return;
                let toSend = (direction === 1) ? "1" : "-1";
                gameSM.send(GAME_TYPES.DIRECTION, toSend);
                //if ai loss, increase cost
                //ai.increaseCost();
            }else{
                //Normal Bot
                let dst = ai.ballImpactPoint(gameState.ball.x, gameState.ball.y, canvasHeight, canvasWidth, 0, 5);
                let middlePaddle = player.paddle_y + paddle_height / 2;
                //console.log(dst)
                if(dst == NaN || middlePaddle >= dst - 2 && middlePaddle <= dst + 2)
                    return
                if (middlePaddle < dst)
                    gameSM.send(GAME_TYPES.DIRECTION, "1");
                else if (middlePaddle > dst)
                    gameSM.send(GAME_TYPES.DIRECTION, "-1");
            }
        }
    }
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
            //ai.increaseCost()
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
        case 80: // "p" key, print trained AI weights
            ai.printWeights()
        default:
            return null;
    }
}