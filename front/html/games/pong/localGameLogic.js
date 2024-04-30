import { PongAI } from './PongAI.js';
import { drawScore, toggleView } from './pongScript.js';

export function endGame(closed = false) {
    if (intervalId != null) {
        clearInterval(intervalId);
        intervalId = null;
        if (closed === false)
        {
            toggleView(canvasDivView, false)
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

let score = [0, 0];
let paddleWidth = 10;
let paddleLenght = 40;
let canvasWidth = 400;
let canvasHeight = 200;
let ballRadius = 5;
let borderThickness = 5;
let incBallSpeed = 1;
let maxBallSpeed = 5;
let paddleSpeed = 2;

const degToRad = Math.PI / 180;
let intervalId = null;
let leftPlayerMovement;
let rightPlayerMovement;
let pointsToWin = 1;

// 3D objects in scene
var renderer, scene, camera, pointLight, spotLight;
var ball, paddle1, paddle2;

// Toggle view
let optionsView , canvasDivView;
const ai = new PongAI(true);
export function initializeGame(multiplayer = false, realAI = true, use3D = false) {
    canvasDivView = use3D === true ? document.getElementById("canvas3DDiv") : document.getElementById("canvasDiv");
    if (!use3D) {
        canvas = document.getElementById("pongCanvas");
        ctx = canvas.getContext("2d");
    }
    else {
        setup3DEnvironment();
    }
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
        },
        multiplayer: multiplayer,
        realAI: realAI,
        use3D: use3D
    }
    optionsView = document.getElementById("game_options_pong");
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
    gameState.players.left.paddle_x = 7;
    gameState.players.left.paddle_y = 80;
    gameState.players.right.paddle_x = 383;
    gameState.players.right.paddle_y = 80;
    score = [gameState.players.right.score, gameState.players.left.score];
    leftPlayerMovement = 0;
    rightPlayerMovement = 0;
    updateGame(gameState);
    // Delay starting the game interval by 3000 milliseconds
    setTimeout(() => {
        intervalId = setInterval(() => {
            newFrame();
        }, 16);
        // intervalId = setInterval(() => newFrame(isMultiplayer), 32); // Uncomment for SLOWMO mode
    }, 3000);
}

function newFrame() {
    
    gameState.players.left.paddle_y = Math.min(Math.max(gameState.players.left.paddle_y + leftPlayerMovement, 0), canvasHeight - paddleLenght);
    if (gameState.multiplayer === true)
        gameState.players.right.paddle_y = Math.min(Math.max(gameState.players.right.paddle_y + rightPlayerMovement, 0), canvasHeight - paddleLenght);
    else {
        if (gameState.realAI) {
            // gameState.players.right.paddle_y = Math.min(Math.max(gameState.players.right.paddle_y + decideNextMove(gameState.players.right.paddle_y, gameState.ball), 0), canvasHeight - paddleLenght);
            let aiMove = ai.process(gameState.ball.x, gameState.ball.y, gameState.players.right.paddle_y, paddleLenght, canvasHeight, canvasWidth, borderThickness, ballRadius);
            gameState.players.right.paddle_y = Math.min(Math.max(gameState.players.right.paddle_y + aiMove * paddleSpeed, 0), canvasHeight - paddleLenght);
        }
        else {
            let dst = ai.ballImpactPoint(gameState.ball.x, gameState.ball.y, canvasHeight, canvasWidth, borderThickness, ballRadius);
            let middlePaddle = gameState.players.right.paddle_y + paddleLenght / 2;
            if(!(dst == NaN || middlePaddle >= dst - 2 && middlePaddle <= dst + 2)) {
                if (middlePaddle < dst)
                    gameState.players.right.paddle_y = Math.min(Math.max(gameState.players.right.paddle_y + paddleSpeed, 0), canvasHeight - paddleLenght);
                else if (middlePaddle > dst)
                    gameState.players.right.paddle_y = Math.min(Math.max(gameState.players.right.paddle_y - paddleSpeed, 0), canvasHeight - paddleLenght);
            }
        }
    }
    detectCollision();
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
        checkPaddleCollision(ball, player);
    }

    if (ball.x <= leftSize) {
        gameState.players.left.score += 1;
        if (gameState.players.left.score == pointsToWin) {
            endGame();
        } else {
            startGame();
        }
    }
    if (ball.x >= rightSize) {
        gameState.players.right.score += 1;
        if (gameState.players.right.score == pointsToWin) {
            endGame();
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
	if(gameState.use3D){
		if(ball.speed_x > 0) {
			paddle1.scale.y = 5;
		} else if(ball.speed_x < 0) {
			paddle2.scale.y = 5;
		}
	}
}

function moveBall(ball) {
    ball.x = ball.x + ball.speed_x;
    ball.y = ball.y + ball.speed_y;
}

function updateGame(gameState) {
    if (!gameState.use3D) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Black background
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw Score
        drawScore(score);
        // Draw paddles
        for (const playerId in gameState.players) {
            const player = gameState.players[playerId];
            drawPaddle(player.paddle_x, player.paddle_y);
        }
        // Draw ball
        drawBall(gameState.ball.x, gameState.ball.y);
    } else {
        renderer.render(scene, camera);
        cameraPhysics();
        for (const playerId in gameState.players) {
            const player = gameState.players[playerId];
            move3DPaddle(playerId, player.paddle_x, player.paddle_y);
        }
        move3Dball(gameState.ball.x, gameState.ball.y);
    }
    
}

function move3DPaddle(playerId, x, y) {
    if (playerId == "left") {
        paddle1.position.x = x;
        paddle1.position.y = y + paddleLenght / 2;
		paddle1.scale.y += (1 - paddle1.scale.y) * 0.2;	
		paddle1.scale.z += (1 - paddle1.scale.z) * 0.2;
		if(paddle1.position.y + paddleLenght / 2 >= canvasHeight - 0.5 || paddle1.position.y - paddleLenght / 2 <= 0.5)
			paddle1.scale.z += (5 - paddle1.scale.z) * 0.2;
    }
    else {
        paddle2.position.x = x;
        paddle2.position.y = y + paddleLenght / 2;
		paddle2.scale.y += (1 - paddle2.scale.y) * 0.2;	
		paddle2.scale.z += (1 - paddle2.scale.z) * 0.2;
		if(paddle2.position.y + paddleLenght / 2 >= canvasHeight - 0.5 || paddle2.position.y - paddleLenght / 2 <= 0.5)
			paddle2.scale.z += (5 - paddle2.scale.z) * 0.2;
    }
}

function move3Dball(x, y) {
    ball.position.x = x;
    ball.position.y = y;
}

function cameraPhysics()
{
    spotLight.position.x = gameState.ball.x * 2;
    spotLight.position.y = gameState.ball.y * 2;
    camera.position.x = gameState.players.left.paddle_x - 100;
    camera.position.y += (gameState.players.left.paddle_y - camera.position.y) * 0.05;
    camera.position.z = ballRadius + 100 + 0.04 * (-gameState.ball.x + gameState.players.left.paddle_x);
    camera.rotation.x = -0.01 * (gameState.ball.y) * Math.PI/180;
    camera.rotation.y = -60 * Math.PI/180;
    camera.rotation.z = -90 * Math.PI/180;
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
	//const multiplayer = options.multiplayer;
    //const use3D = options.use3D;
	if (gameState.use3D) {
		switch (event.keyCode) {
			case 65: // A
				leftPlayerMovement = paddleSpeed;
				break;
			case 68: // D
				leftPlayerMovement = -paddleSpeed;
				break;
		}
	}
	else if (gameState.multiplayer) {
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
				break;
			default:;
		}
	}
	else {
		switch (event.keyCode) {
			case 87: // W
				leftPlayerMovement = -paddleSpeed;
				break;
			case 83: // S
				leftPlayerMovement = paddleSpeed;
				break;
			default:;
		}
	}
    
}

function handleKeyUp(event) {
	//const multiplayer = options.multiplayer;
    //const use3D = options.use3D;
	if (gameState.use3D) {
		switch (event.keyCode) {
			case 65: // A
				leftPlayerMovement = 0;
				break;
        	case 68: // D
				leftPlayerMovement = 0;
				break;
			default:;
		}
	}
	else if (gameState.multiplayer) {
		switch (event.keyCode) {
			case 87: // W
				leftPlayerMovement = 0;
				break;
			case 83: // S
				leftPlayerMovement = 0;
				break;
			case 79: // O
				leftPlayerMovement = 0;
				break;
			case 76: // L
				rightPlayerMovement = 0;
				break;
			default:;
		}
	} else {
		switch (event.keyCode) {
			case 87: // W
				leftPlayerMovement = 0;
				break;
			case 83: // S
				leftPlayerMovement = 0;
				break;
			default:;
		}
	}
}

function setup3DEnvironment() {
    
    var WIDTH = 700,
        HEIGHT = 350;

    var VIEW_ANGLE = 50,
        ASPECT = WIDTH / HEIGHT,
          NEAR = 0.1,
          FAR = 10000;

	var planeWidth = canvasWidth,
		planeHeight = canvasHeight,
		planeQuality = 10;

    var c = document.getElementById("pong3DCanvas");
    
    renderer = new THREE.WebGLRenderer({ canvas: c });
    camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);

    scene = new THREE.Scene();
    scene.add(camera);
    camera.position.z = 320;
	camera.position.x = planeWidth / 2;
	camera.position.y = planeHeight / 2;
    
    // start the renderer
    renderer.setSize(WIDTH, HEIGHT);

    // create the paddle1's material
    var paddle1Material = new THREE.MeshLambertMaterial({ color: 0x1B32C0 });
    // create the paddle2's material
    var paddle2Material = new THREE.MeshLambertMaterial({ color: 0xFF4045 });
    // create the plane's material
    var planeMaterial = new THREE.MeshLambertMaterial({ color: 0x4BD121 });
    // create the table's material
    var tableMaterial = new THREE.MeshLambertMaterial({ color: 0x111111 });
    // create the ground's material
    var groundMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        
        
    // Game table
    var plane = new THREE.Mesh(new THREE.PlaneGeometry(planeWidth, planeHeight, planeQuality, planeQuality), planeMaterial);
    plane.receiveShadow = true;
    plane.position.x = planeWidth / 2;
    plane.position.y = planeHeight / 2;
    scene.add(plane);
    
    // Outside table
    var table = new THREE.Mesh(new THREE.CubeGeometry(planeWidth * 1.05, planeHeight * 1.03, 100, planeQuality, planeQuality, 1), tableMaterial);
    table.position.z = -51;
    table.receiveShadow = true;
    table.position.x = planeWidth / 2;
    table.position.y = planeHeight / 2;
    scene.add(table);

	// Ground
    var ground = new THREE.Mesh(new THREE.CubeGeometry(1000, 1000, 3, 1, 1,1 ), groundMaterial);
    ground.position.z = -132;
    ground.receiveShadow = true;
    ground.position.x = planeWidth / 2;
    ground.position.y = planeHeight / 2;
    scene.add(ground);

    // Ball
    var segments = 6, rings = 6;
    var sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xD43001 });
    ball = new THREE.Mesh(new THREE.SphereGeometry(ballRadius, segments, rings), sphereMaterial);

    ball.position.x = planeWidth / 2;
    ball.position.y = planeHeight / 2;
    ball.position.z = ballRadius;
    ball.receiveShadow = true;
    ball.castShadow = true;
    scene.add(ball);
    

    let paddleDepth = 10;
    let paddleQuality = 10

    paddle1 = new THREE.Mesh(
        new THREE.CubeGeometry(
            paddleWidth,
            paddleLenght,
            paddleDepth,
            paddleQuality,
            paddleQuality,
            paddleQuality),
        paddle1Material);

    paddle1.receiveShadow = true;
    paddle1.castShadow = true;
    paddle1.position.y = planeHeight / 2;
    paddle1.position.x = 383;
	paddle1.position.z = paddleDepth;
    scene.add(paddle1);
    
    paddle2 = new THREE.Mesh(
        new THREE.CubeGeometry(
            paddleWidth,
            paddleLenght,
            paddleDepth,
            paddleQuality,
            paddleQuality,
            paddleQuality),
        paddle2Material);
      
    
    paddle2.receiveShadow = true;
    paddle2.castShadow = true;
    paddle2.position.y = planeHeight / 2;
    paddle2.position.x = 7;
	paddle2.position.z = paddleDepth;
    scene.add(paddle2);

    // Light
    pointLight = new THREE.PointLight(0xF8D898);
    pointLight.position.x = -1000;
    pointLight.position.y = 0;
    pointLight.position.z = 1000;
    pointLight.intensity = 2.9;
    pointLight.distance = 10000;
    scene.add(pointLight);

    // Spot light
    spotLight = new THREE.SpotLight(0xF8D898);
    spotLight.position.set(0, 0, 460);
    spotLight.intensity = 1.5;
    spotLight.castShadow = true;
    scene.add(spotLight);
    
    renderer.shadowMapEnabled = true;
}
