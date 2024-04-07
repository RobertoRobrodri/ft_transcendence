
export function registerVersusGame() {
    document.getElementById("initonegame").addEventListener("click", initializeVersusGame);
    document.getElementById("endonegame").addEventListener("click", endVersusGame);
}

function endVersusGame() {
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

let paddleWidth = 10;
let paddleLenght = 40;
let paddleMargin = 2;
let canvasWidth = 400;
let canvasHeight = 200;
let ballRadius = 5;
let borderThickness = 5;
let sleepMatch = 3;
let sleep = 1;
let incBallSpeed = 1;
let maxBallSpeed = 6;
let paddleSpeed = 1;

const degToRad = Math.PI / 180;
let intervalId = null;
let leftPlayerMovement;
let rightPlayerMovement;
let leftCollisionX = 22;
let rightCollisionX = 378;
let pointsToWin = 6;

function initializeVersusGame() {
    canvas = document.getElementById("pongCanvas");
    ctx = canvas.getContext("2d");
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
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
                paddle_y: 80,
                nbr: 1,
                score: 0
            },
            right: {
                paddle_x: 383,
                paddle_y: 80,
                nbr: 2,
                score: 0
            }
        }
    }
    startGame() 
}

function startGame() {
    if (intervalId != null) {
        clearInterval(intervalId);
    }
    gameState.ball = {
        x: 200,
        y: 100,
        speed_x: Math.random() < 0.5 ? -3 : 3,
        speed_y: getRandomYSpeed()
    };
    console.log("Starting game");
    leftPlayerMovement = 0;
    rightPlayerMovement = 0;
    intervalId = setInterval(newFrame, 16);
    // intervalId = setInterval(newFrame, 32); // SLOWMO
}

function newFrame() {
    
    gameState.players.left.paddle_y = Math.min(Math.max(gameState.players.left.paddle_y + leftPlayerMovement, 0), canvasHeight - paddleLenght);
    gameState.players.right.paddle_y = Math.min(Math.max(gameState.players.right.paddle_y + rightPlayerMovement, 0), canvasHeight - paddleLenght);;
    
    detectCollision();

    moveBall(gameState.ball);

    console.log(gameState.ball);

    updateGame(gameState);
}

function detectCollision() {
    let ball = gameState.ball;

    let leftSize = 0 + borderThickness + ballRadius;
    let rightSize = canvasWidth - borderThickness - ballRadius;
    let topSize = 0 + borderThickness + ballRadius;
    let bottomSize = canvasHeight - borderThickness - ballRadius;

    for (const playerId in gameState.players) {
        const player = gameState.players[playerId];
        checkPaddleCollision(ball, player);
    }

    if (ball.x <= leftSize) {
        gameState.players.left.score += 1;
        if (gameState.players.left.score == pointsToWin) {
            endVersusGame();
        } else {
            startGame();
        }
    }
    if (ball.x >= rightSize) {
        gameState.players.right.score += 1;
        if (gameState.players.right.score == pointsToWin) {
            endVersusGame();
        } else {
            startGame();
        }
    }

    if (ball.y <= topSize || ball.y >= bottomSize) {
        ball.speed_y *= -1;
    }
}

function checkPaddleCollision(ball, paddle) {
    let paddleX = paddle.paddle_x;
    let paddleY = paddle.paddle_y;
    let playerNbr = paddle.nbr;

    let paddleLeft = paddleX;
    let paddleRight = paddleX + paddleWidth;
    let paddleTop = paddleY;
    let paddleBottom = paddleY + paddleLenght;

    if (playerNbr == 1 && ball.speed_x > 0) {
        return ;
    } else if (playerNbr == 2 && ball.speed_x < 0) {
        return ;
    }

    if (playerNbr == 1 && ball.x < paddleRight) {
        return ;
    } else if (playerNbr == 2 && ball.x > paddleLeft) {
        return ;
    }

    if ((paddleLeft <= ball.x + ballRadius && ball.x + ballRadius <= paddleRight ||
        paddleLeft <= ball.x - ballRadius && ball.x - ballRadius <= paddleRight) &&
        (paddleTop <= ball.y + ballRadius && ball.y + ballRadius <= paddleBottom ||
        paddleTop <= ball.y - ballRadius && ball.y - ballRadius <= paddleBottom)) {
            handlePaddleCollision(ball, paddleY);
    }
}

function handlePaddleCollision(ball, paddleY) {
    let relativeIntersectY = (paddleY + paddleLenght / 2) - ball.y;
    let normalizedRelativeIntersectY = relativeIntersectY / (paddleLenght / 2);
    let bounceAngle = Math.atan2(normalizedRelativeIntersectY, 1);
    if (ball.speed_x > 0) {
        bounceAngle = Math.PI - bounceAngle;
    }
    let ballSpeed = Math.sqrt(Math.pow(ball.speed_x, 2) + Math.pow(ball.speed_y, 2));
    if ((ball.speed_y > 0 && Math.sin(bounceAngle) > 0) || (ball.speed_y < 0 && Math.sin(bounceAngle) < 0)) {
        ballSpeed = Math.max(ballSpeed - incBallSpeed, ballSpeed);
    } else {
        ballSpeed = Math.min(ballSpeed + incBallSpeed, maxBallSpeed);
    }
    ball.speed_x = ballSpeed * Math.cos(bounceAngle);
    ball.speed_y = ballSpeed * (-1 * Math.sin(bounceAngle));
}

function moveBall(ball) {
    ball.x = ball.x + ball.speed_x;
    ball.y = ball.y + ball.speed_y;
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
            leftPlayerMovement = -paddleSpeed;
            break;
        case 83: // S
            leftPlayerMovement = paddleSpeed;
            break;
        case 79: // O
            rightPlayerMovement = -paddleSpeed;
            break;
        case 76: // L
            rightPlayerMovement = paddleSpeed;
        default:;
    }
}

function handleKeyUp(event) {
    switch (event.keyCode) {
        case 87: // W
            leftPlayerMovement = 0;
            break;
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
