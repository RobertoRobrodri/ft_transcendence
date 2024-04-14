
console.log("onegame.js was loaded");

export function registerOneGame() {
    document.getElementById("initonegame").addEventListener("click", initializeOneGame);
    document.getElementById("endonegame").addEventListener("click", endOneGame);
}

function endOneGame() {
    if (intervalId != null) {
        clearInterval(intervalId);
        intervalId = null;
    }
}

////////////////////
// ONE GAME LOGIC //
////////////////////

let canvas;
let ctx;
let gameState;
const degToRad = Math.PI / 180;
let intervalId = null;
let leftPlayerMovement;
let rightPlayerMovement;
let canvasHeight = 200; //TODO: Make this dependant on html element (?)
let canvasWidth = 400; //TODO: Make this dependant on html element (?)
let paddleLenght = 40; //TODO: How's this going to be defined (?)
let ballRadius = 5; //TODO: How's this going to be defined (?)
let leftCollisionX = 22;
let rightCollisionX = 378;

function initializeOneGame() {
    canvas = document.getElementById("pongCanvas");
    ctx = canvas.getContext("2d");
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    startGame()
}

function startGame() {
    if (intervalId != null) {
        clearInterval(intervalId);
    }
    gameState = {
        ball: {
            x: 200,
            y: 100,
            speed_x: Math.random() < 0.5 ? -3 : 3,
            speed_y: getRandomYSpeed()
        },
        players: {
            left: {
                paddle_x: 7,
                paddle_y: 80
            },
            right: {
                paddle_x: 383,
                paddle_y: 80
            }
        }
    }
    console.log("Starting game");
    leftPlayerMovement = 0;
    rightPlayerMovement = 0;
    intervalId = setInterval(newFrame, 16);
    // intervalId = setInterval(newFrame, 32); // SLOWMO
}

function calculateY(startX, startY, endX, endY, desiredX) {
    if (startY == endY) {
        return startY;
    }
    let slope = (startY - endY) / (startX - endX);
    let incr = startY - slope * startX;
    return slope * desiredX + incr;
}

function calculateNewBallPosition(ball) {
    let next_x = ball.x + ball.speed_x;
    let next_y = ball.y + ball.speed_y;

    // WALL HITS
    if (next_y < (0 + ballRadius) || next_y > (canvasHeight - ballRadius)) {
        console.log("WALL HIT!");
        ball.speed_y *= -1;
        next_y = ball.y + ball.speed_y;
    }
    
    // POINT CHECKS
    if (next_x < (0 + ballRadius) || next_x > (canvasWidth - ballRadius)) {
        startGame(); // TODO: check points and shit
    }
    
    // LEFT PADDLE HITS
    if (next_x < leftCollisionX && ball.x > leftCollisionX) {
        let wasInCollisionZone = ball.y > gameState.players.left.paddle_y && ball.y < (gameState.players.left.paddle_y + paddleLenght);
        let isInCollisionZone = next_y > gameState.players.left.paddle_y && next_y < (gameState.players.left.paddle_y + paddleLenght);
        if (isInCollisionZone) {
            if (wasInCollisionZone) {
                console.log("LEFT PADDLE HIT!");
                ball.speed_x *= -1;
                next_x = ball.x + ball.speed_x;
            } else {
                crossPointY = calculateY(ball.x, ball.y, next_x, next_y, leftCollisionX);
                if (crossPointY > gameState.players.left.paddle_y && crossPointY < (gameState.players.left.paddle_y + paddleLenght)) {    
                    console.log("LEFT PADDLE HIT!");
                    ball.speed_x *= -1;
                    next_x = ball.x + ball.speed_x;
                }
            }
        }
    }
    
    // RIGHT PADDLE HITS
    if (next_x > rightCollisionX && ball.x < rightCollisionX) {
        let wasInCollisionZone = ball.y > gameState.players.right.paddle_y && ball.y < (gameState.players.right.paddle_y + paddleLenght);
        let isInCollisionZone = next_y > gameState.players.right.paddle_y && next_y < (gameState.players.right.paddle_y + paddleLenght);
        if (isInCollisionZone) {
            if (wasInCollisionZone) {
                console.log("RIGHT PADDLE HIT!");
                ball.speed_x *= -1;
                next_x = ball.x + ball.speed_x;
            } else {
                crossPointY = calculateY(ball.x, ball.y, next_x, next_y, rightCollisionX);
                if (crossPointY > gameState.players.right.paddle_y && crossPointY < (gameState.players.right.paddle_y + paddleLenght)) {    
                    console.log("RIGHT PADDLE HIT!");
                    ball.speed_x *= -1;
                    next_x = ball.x + ball.speed_x;
                }
            }
        }
    }

    ball.x = next_x;
    ball.y = next_y;
}

function newFrame() {
    //console.log("one loop");
    
    // // CALCULATING BALL POSITION
    // gameState.ball.x += gameState.ball.speed_x;
    // gameState.ball.y += gameState.ball.speed_y;
    
    // // CALCULATING COLLISION
    // if (gameState.ball.y < 5 || gameState.ball.y > 195) {
    //     gameState.ball.speed_y *= -1;
    // }
    // if ((gameState.ball.x < 25 && gameState.ball.y > gameState.players.left.paddle_y && gameState.ball.y < gameState.players.left.paddle_y + 40)|| gameState.ball.x > 395) {
    //     gameState.ball.speed_x *= -1;
    // }

    // CALCULATING PLAYER POSITION
    gameState.players.left.paddle_y += leftPlayerMovement;
    gameState.players.right.paddle_y += rightPlayerMovement;

    calculateNewBallPosition(gameState.ball);

    console.log(gameState.ball);

    updateGame(gameState);
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

function drawBall(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffff";
    ctx.fill();
    ctx.closePath();
}

function drawPaddle(x, y) {
    ctx.fillStyle = "#ffff";
    ctx.fillRect(x, y, 10, 40);
}

function getRandomYSpeed() {
    return Math.random() * (150 * degToRad) - (75 * degToRad)
}

function handleKeyDown(event) {
    switch (event.keyCode) {
        case 87: // W
            leftPlayerMovement = -1;
            break;
        case 83: // S
            leftPlayerMovement = 1;
            break;
        case 79: // O
            rightPlayerMovement = -1;
            break;
        case 76: // L
            rightPlayerMovement = 1;
        default:;
    }
}

function handleKeyUp(event) {
    switch (event.keyCode) {
        case 87: // W
            leftPlayerMovement = 0;
        case 83: // S
            leftPlayerMovement = 0;
            break;
        case 79: // O
            rightPlayerMovement = 0;
            break;
        case 76: // L
            rightPlayerMovement = 0;
        default:;
    }
}

// function setSpeeds(ball, angle) {
//     ball.speed_x = 
// }