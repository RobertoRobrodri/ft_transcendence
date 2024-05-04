import { toggleView } from './pongScript.js';

export function endFourGame(closed = false) {
    let win = document.getElementById("myWindowGame-content");
    if(win)
        win.style.overflow = "auto";
    // let winGame = document.getElementById("myWindowGame");
    // if (winGame)
    //     winGame.style.height = "450px";

    if (timeOutId != null) {
        clearTimeout(timeOutId);
        timeOutId = null;
    }
    if (intervalId != null) {
        clearInterval(intervalId);
        intervalId = null;
        if (closed === false)
        {
            toggleView(canvasFourDivView, false)
            toggleView(optionsView, true)
        }
    }
}

////////////////////
// ONE GAME LOGIC //
////////////////////

let canvas;
let ctx;
let gameState;

let score = [0, 0, 0, 0];
let paddleWidth = 10;
let paddleLenght = 40;
let paddle_margin = 2;
let canvasWidth = 400;
let canvasHeight = 400;
let ballRadius = 5;
let borderThickness = 0;
let incBallSpeed = 1;
let maxBallSpeed = 5;
let initialBallSpeed = 2;
let paddleSpeed = 2;

const degToRad = Math.PI / 180;
let intervalId = null;
let timeOutId = null;
let leftPlayerMovement;
let rightPlayerMovement;
let upPlayerMovement;
let downPlayerMovement;
let pointsToWin = 3;
let lastTouchNbr = 0;

// Toggle view
let optionsView , canvasDivView;
export function initializeFourGame(multiplayer = false, realAI = true, use3D = false) {
    let win = document.getElementById("myWindowGame-content");
    let winGame = document.getElementById("myWindowGame");
    win.style.overflow = "hidden";
    winGame.style.height = "900px";
    canvasDivView = document.getElementById("canvasFourDiv");
    canvas = document.getElementById("fourPongCanvas");
    ctx = canvas.getContext("2d");
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    gameState = {
        ball: {
            x: canvasWidth / 2,
            y: canvasHeight / 2,
            speed_x: Math.random() < 0.5 ? -3 : 3,
            speed_y: getRandomYSpeed()
        },
        players: {
            left: {
                paddle_x: 0 + borderThickness + paddle_margin,
                paddle_y: (canvasHeight / 2) - (paddleLenght / 2),
                nbr: 1,
                score: 0
            },
            right: {
                paddle_x: canvasWidth - borderThickness - paddleWidth - paddle_margin,
                paddle_y: (canvasHeight / 2) - (paddleLenght / 2),
                nbr: 2,
                score: 0
            },
            up: {
                paddle_x: (canvasWidth / 2) - (paddleLenght / 2),
                paddle_y: 0 + borderThickness + paddle_margin,
                nbr: 3,
                score: 0
            },
            down: {
                paddle_x: (canvasWidth / 2) - (paddleLenght / 2),
                paddle_y: canvasHeight - borderThickness - paddleWidth - paddle_margin,
                nbr: 4,
                score: 0
            }
        },
        multiplayer: multiplayer,
    }
    optionsView = document.getElementById("game_options_pong");
    startGame() 
}

function startGame() {
    if (intervalId != null) {
        clearInterval(intervalId);
        intervalId = null;
    }
    let initialAngle = Math.random() * Math.PI;
    gameState.ball = {
        x: canvasWidth / 2,
        y: canvasHeight / 2,
        speed_x: initialBallSpeed * Math.cos(initialAngle),
        speed_y: initialBallSpeed * (-1 * Math.sin(initialAngle))
    };
    gameState.players.left.paddle_x = 0 + borderThickness + paddle_margin;
    gameState.players.left.paddle_y = (canvasHeight / 2) - (paddleLenght / 2);
    gameState.players.right.paddle_x = canvasWidth - borderThickness - paddleWidth - paddle_margin;
    gameState.players.right.paddle_y = (canvasHeight / 2) - (paddleLenght / 2);
    gameState.players.up.paddle_x = (canvasWidth / 2) - (paddleLenght / 2);
    gameState.players.up.paddle_y = 0 + borderThickness + paddle_margin;
    gameState.players.down.paddle_x = (canvasWidth / 2) - (paddleLenght / 2);
    gameState.players.down.paddle_y = canvasHeight - borderThickness - paddleWidth - paddle_margin;
    score = [gameState.players.left.score, gameState.players.right.score, gameState.players.up.score, gameState.players.down.score];
    lastTouchNbr = 0;
    leftPlayerMovement = 0;
    rightPlayerMovement = 0;
    upPlayerMovement = 0;
    downPlayerMovement = 0;
    updateGame(gameState);
    // Delay starting the game interval by 3000 milliseconds
    timeOutId = setTimeout(() => {
        intervalId = setInterval(() => {
            newFrame();
        }, 16);
        // intervalId = setInterval(() => newFrame(isMultiplayer), 32); // Uncomment for SLOWMO mode
    }, 3000);
}

function newFrame() {
    
    gameState.players.left.paddle_y = Math.min(Math.max(gameState.players.left.paddle_y + leftPlayerMovement, 0), canvasHeight - paddleLenght);
    gameState.players.right.paddle_y = Math.min(Math.max(gameState.players.right.paddle_y + rightPlayerMovement, 0), canvasHeight - paddleLenght);
    gameState.players.up.paddle_x = Math.min(Math.max(gameState.players.up.paddle_x + upPlayerMovement, 0), canvasWidth - paddleLenght);
    gameState.players.down.paddle_x = Math.min(Math.max(gameState.players.down.paddle_x + downPlayerMovement, 0), canvasWidth - paddleLenght);

    if (!detectCollision())
        return;
    moveBall(gameState.ball);
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
        if (player.nbr < 3) {
            checkPaddleCollision(ball, player);
        } else {
            checkHorPaddleCollision(ball, player);
        }
    }

    if (ball.x <= leftSize || ball.x >= rightSize || ball.y <= topSize || ball.y >= bottomSize) {
        if (lastTouchNbr != 0) {
            for (const playerId in gameState.players) {
                const player = gameState.players[playerId];
                if (player.nbr == lastTouchNbr) {
                    player.score++;
                    if (player.score == pointsToWin) {
                        endFourGame();
                        return false;
                    }
                }
            }
        }
        startGame();
        return false;
    }

    return true
}

function checkPaddleCollision(ball, paddle) {
    let paddleX = paddle.paddle_x;
    let paddleY = paddle.paddle_y;
    let playerNbr = paddle.nbr;

    let paddleLeft = paddleX;
    let paddleRight = paddleX + paddleWidth;
    let paddleTop = paddleY;
    let paddleBottom = paddleY + paddleLenght;

    if (playerNbr == 1 && ball.speed_x > 0)
        return ;
    else if (playerNbr == 2 && ball.speed_x < 0)
        return ;
    
    if (playerNbr == 1 && ball.x < paddleRight)
        return ;
    else if (playerNbr == 2 && ball.x > paddleLeft)
        return ;

    if ((paddleLeft <= ball.x + ballRadius && ball.x + ballRadius <= paddleRight ||
        paddleLeft <= ball.x - ballRadius && ball.x - ballRadius <= paddleRight) &&
        (paddleTop <= ball.y + ballRadius && ball.y + ballRadius <= paddleBottom ||
        paddleTop <= ball.y - ballRadius && ball.y - ballRadius <= paddleBottom)) {
            lastTouchNbr = playerNbr;
            handlePaddleCollision(ball, paddleY);
    }
}

function checkHorPaddleCollision(ball, paddle) {
    let paddleX = paddle.paddle_x;
    let paddleY = paddle.paddle_y;
    let playerNbr = paddle.nbr;

    let paddleLeft = paddleX;
    let paddleRight = paddleX + paddleLenght;
    let paddleTop = paddleY;
    let paddleBottom = paddleY + paddleWidth;

    if (playerNbr == 3 && ball.speed_y > 0)
        return ;
    else if (playerNbr == 4 && ball.speed_y < 0)
        return ;
    
    if (playerNbr == 3 && ball.y < paddleBottom)
        return ;
    else if (playerNbr == 4 && ball.y > paddleTop)
        return ;

    if ((paddleLeft <= ball.x + ballRadius && ball.x + ballRadius <= paddleRight ||
        paddleLeft <= ball.x - ballRadius && ball.x - ballRadius <= paddleRight) &&
        (paddleTop <= ball.y + ballRadius && ball.y + ballRadius <= paddleBottom ||
        paddleTop <= ball.y - ballRadius && ball.y - ballRadius <= paddleBottom)) {
            lastTouchNbr = playerNbr;
            handleHorPaddleCollision(ball, paddleX);
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

function handleHorPaddleCollision(ball, paddleX) {
    let relativeIntersectX = (paddleX + paddleLenght / 2) - ball.x;
    let normalizedRelativeIntersectX = relativeIntersectX / (paddleLenght / 2);
    let bounceAngle = Math.atan2(normalizedRelativeIntersectX, 1);
    if (ball.speed_y > 0) {
        bounceAngle = Math.PI - bounceAngle;
    }
    let ballSpeed = Math.sqrt(Math.pow(ball.speed_x, 2) + Math.pow(ball.speed_y, 2));
    // DE AQUÍ PARA ABAJO DUDAS
    if ((ball.speed_x > 0 && Math.cos(bounceAngle) > 0) || (ball.speed_x < 0 && Math.cos(bounceAngle) < 0)) {
        ballSpeed = Math.max(ballSpeed - incBallSpeed, ballSpeed);
    } else {
        ballSpeed = Math.min(ballSpeed + incBallSpeed, maxBallSpeed);
    }
    ball.speed_x = ballSpeed * (-1 * Math.sin(bounceAngle));
    ball.speed_y = ballSpeed * Math.cos(bounceAngle);
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
    // Draw lines
    drawDashedCenterLine();
    // Draw Score
    drawScore(score);
    // Draw paddles
    for (const playerId in gameState.players) {
        const player = gameState.players[playerId];
        if (player.nbr < 3) {
            drawPaddle(player.paddle_x, player.paddle_y);
        } else {
            drawHorPaddle(player.paddle_x, player.paddle_y);
        }
    }
    // Draw ball
    drawBall(gameState.ball.x, gameState.ball.y);
}

function drawDashedCenterLine() {
    ctx.fillStyle = "#9b9b9b";
    const lineHeight = 10;
    const gap = 20;
    const center = canvas.width / 2;
    for (let y = 5; y < canvas.height; y += gap) {
        ctx.fillRect(center - 2.5, y, 5, lineHeight);
    }
    for (let x = 5; x < canvas.width; x += gap) {
        ctx.fillRect(x, center - 2.5, lineHeight, 5);
    }
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

function drawHorPaddle(x, y) {
    ctx.fillStyle = "#ffff";
    ctx.fillRect(x, y, 40, 10);
}

function drawScore(scores) {
    // Set font style
    ctx.font = "20px Arial";
    ctx.fillStyle = "#45f3ff";
    ctx.textAlign = "center";

    ctx.fillText(scores[0], canvasWidth / 4, canvasHeight / 2);
    ctx.fillText(scores[1], canvasWidth * 3 / 4, canvasHeight / 2);
    ctx.fillText(scores[2], canvasWidth / 2, canvasHeight / 4);
    ctx.fillText(scores[3], canvasWidth / 2, canvasHeight * 3 / 4);
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
        case 101: // 5
            rightPlayerMovement = -paddleSpeed;
            break;
        case 98: // 2
            rightPlayerMovement = paddleSpeed;
            break;
        case 67: // C
            upPlayerMovement = -paddleSpeed;
            break;
        case 86: // V
            upPlayerMovement = paddleSpeed;
            break;
        case 79: // O
            downPlayerMovement = -paddleSpeed;
            break;
        case 80: // P
            downPlayerMovement = paddleSpeed;
            break;
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
        case 101: // 5
            rightPlayerMovement = 0;
            break;
        case 98: // 2
            rightPlayerMovement = 0;
            break;
        case 67: // C
            upPlayerMovement = 0;
            break;
        case 86: // V
            upPlayerMovement = 0;
            break;
        case 79: // O
            downPlayerMovement = 0;
            break;
        case 80: // P
            downPlayerMovement = 0;
            break;
        default:;
    }
}