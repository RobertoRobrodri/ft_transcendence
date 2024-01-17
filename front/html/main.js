/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   main.js                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: guilmira <guilmira@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/01/09 12:20:55 by guilmira          #+#    #+#             */
/*   Updated: 2024/01/16 08:25:38 by guilmira         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

/* Pong developed in JS Canvas. Specs:
	-OX, OY axis origin in upper left corner. 
		i.e, OY increases from the upper part to the lower.
	-Working with position and velocity vectors.
	-Position and dimensions are measured in px.
	-Speed (and therfore velocity) is measured in px/s. */

/* CANVAS DEF */
const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");
/* GLOBAL CONSTRAINTS -- Modify to change game specs.*/
const palaSpeed = 800;
const palaWidth = 20;
const palaLength = 200;
const ballSpeed = 200;
/* GLOBAL CONSTRAINTS -- Dimensions. Not to modify lightly. */
canvas.width = 900; /* Advised values: 1200, 1200 */
canvas.height = 1200;
/* Non modifiable scores. */
let deltaTime;

export { canvas, ctx, palaSpeed, palaWidth, palaLength, ballSpeed}
import { Vector, CanvasEntity, Pala, Ball, Player } from "./classes.js";

/* Main body-------------------------------------------------- */
let animationId;
let lastTimeStamp = 0;

const palaLeft = new Pala();
const palaRight = new Pala(new Vector(canvas.width - palaWidth, canvas.height - palaLength));
const playerLeft = new Player("Player1", 0, new Vector(canvas.width / 2 - 100, canvas.height / 2 - 100));
const playerRight = new Player("Player2", 0, new Vector(canvas.width / 2 + 100, canvas.height / 2 + 100));
const mainBall = new Ball();
const e = new CanvasEntity(new Vector(0, 0));

requestAnimationFrame(perFrame);

/* ------------------------------------------------------------- */

/* Def: animatios executed per freame
	-timeStamp is a variable given autom. by the browser */
function perFrame(timeStamp)
{
	deltaTime = (timeStamp - lastTimeStamp) / 1000;
	lastTimeStamp = timeStamp;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	/* deltaTime -= 0.016 */
	playerLeft.score = mainBall.arrayScores[0];
	playerRight.score = mainBall.arrayScores[1];
	drawScores();

	handleKeyPress();
	palaLeft.drawSelf();
	
	
	palaRight.drawSelf();

	mainBall.drawSelf();
	mainBall.handleCollisions(palaLeft, palaRight);
	mainBall.updatePosition(deltaTime);
	
	e.displayCoor();
	animationId = requestAnimationFrame(perFrame);
}

function drawScores()
{
	ctx.font = "20px Arial";
	ctx.fillStyle = "grey";
	ctx.fillText(playerLeft.name, playerLeft.scorePosition.x, playerLeft.scorePosition.y);
	ctx.fillText("" + playerLeft.getScore(mainBall), playerLeft.scorePosition.x, playerLeft.scorePosition.y + 50);
	ctx.fillText(playerRight.name, playerRight.scorePosition.x, playerRight.scorePosition.y);
	ctx.fillText("" + playerRight.getScore(mainBall), playerRight.scorePosition.x, playerRight.scorePosition.y + 50);
}

/* ------------------------------------------------------------- */
const teclasPresionadas = {};

/* Tool funcitons */
/* Key control - Lambda functions in eventListeners */
document.addEventListener("keydown", function(event)
{
	teclasPresionadas[event.key] = true;
	handleKeyPress();
});
  
document.addEventListener("keyup", function(event)
{
	teclasPresionadas[event.key] = false;
	handleKeyPress();
});

function controlPala(pala, dir)
{
	if (!pala.isScreenLimit(dir))
	{
		pala.changeVelocityDir(dir);
		pala.updatePosition(deltaTime);
		pala.drawSelf();
	}
}

function handleKeyPress()
{
	if (teclasPresionadas["w"])
		controlPala(palaLeft, "up");
	if (teclasPresionadas["s"]) 
		controlPala(palaLeft, "down");
	if (teclasPresionadas["ArrowUp"]) 
		controlPala(palaRight, "up");
	if (teclasPresionadas["ArrowDown"]) 
		controlPala(palaRight, "down");
	
	console.log(deltaTime);
}