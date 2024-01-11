/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   classes.js                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: guilmira <guilmira@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/01/09 12:34:44 by guilmira          #+#    #+#             */
/*   Updated: 2024/01/11 16:37:00 by guilmira         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

/* Class definition */

export { Vector, CanvasEntity, Pala, Ball, Player };
import { canvas, ctx, palaSpeed, palaWidth, palaLength, ballSpeed } from './main.js';

class Player
{
	constructor(name="Default", score=0, scorePosition=new Vector(canvas.width / 2, canvas.height / 2))
	{
		this.name = name;
		this.score = score;
		this.scorePosition = scorePosition;
	}
	getScore() { return this.score; }
}

/* Basic use for position and velocity */
class Vector
{
	constructor(x=0, y=0)
	{
		this.x = x;
		this.y = y;
	}

	setVector(x, y) { this.x = x; this.y = y; }
	add(vec) { this.x += vec.x; this.y += vec.y; }
	substract(vec) { this.x -= vec.x; this.y -= vec.y; }
	invertHorizontal() { this.x *= -1 }
	invertVertical() { this.y *= -1; }
	getModule() {return Math.sqrt( (this.x ** 2) + (this.y ** 2) ); }
	scalarMult(scalar) { this.x *= scalar; this.y *= scalar; }
	scalarDiv(scalar)
	{ 
		if (scalar != 0)
			this.x /= scalar; this.y /= scalar;
	}
	normalized()
	{ 
		if (this.getModule() != 0)
			return this.scalarDiv(this.getModule());
	}
}

/* Main parent class */
class CanvasEntity
{
	constructor(position=new Vector(0, 0))
	{
		this.position = position;
		this.velocity = new Vector(0, 0);
		this.color = "black";
		this.width = 5;
		this.height = 5;
	}

	/* Control velocity */
	changeVelocityDir(direction)
	{
		switch (direction)
		{
			case ("down"):
				if (this.velocity.y < 0)
					this.velocity.invertVertical();
				break;
			case ("up"):
				if (this.velocity.y > 0)
					this.velocity.invertVertical();
				break;
			case ("right"):
				if (this.velocity.x < 0)
					this.velocity.invertHorizontal();
				break;
			case ("left"):
				if (this.velocity.x > 0)
					this.velocity.invertHorizontal();
				break;
		}
	}

	/* Control position */
	updatePosition(deltaTime)
	{
		let scaledVelocity = new Vector(this.velocity.x * deltaTime, this.velocity.y * deltaTime);
		this.position.add(scaledVelocity);
	}

	/* Generic draw rectangle function */
	drawRectangle(color, vectorPos, width, length)
	{
		ctx.fillStyle = color;
		ctx.fillRect(vectorPos.x, vectorPos.y, width, length)
	}

	drawSelf()
	{
		this.drawRectangle(this.color, this.position, this.width, this.height);
	}

	/* For debuggin purposes */
	displayCoor()
	{
		this.drawSelf();
		ctx.font = "12px Arial";
   		ctx.fillText(`(${this.position.x}, ${this.position.y})`, this.position.x + 20, this.position.y + 20);
	}
}

class Pala extends CanvasEntity
{
	constructor(position=new Vector(0, 0))
	{
		super(position);
		this.velocity = new Vector(0, palaSpeed);
		this.color = "blue";
		this.width = palaWidth;
		this.height = palaLength;
	}

	/* Control pala moving put of the frame */
	isScreenLimit(dir)
	{
		if (dir == "up" && this.position.y < 0)
			return true;
		else if (dir == "down" && this.position.y > canvas.height - this.height)
			return true;
		else
			return false;
	}
}

class Ball extends CanvasEntity
{
	constructor(position=new Vector(canvas.width / 2, canvas.height / 2))
	{
		super(position);
		this.velocity = new Vector(ballSpeed, ballSpeed);
		this.color = "green";
		this.width = 12;
		this.height = 12;
		this.colors = ["blue", "yellow", "orange", "red", "purple", "black"];
		this.index = 0;
		this.arrayScores = [0, 0];
	}


	/* Controls conlision with the pala */
	isPalaLimit(pala, side)
	{
		const palaUpper = pala.position.y;
		const palaLower = pala.position.y + pala.height;
		
		if ((this.velocity.x > 0 && side == "left") || (this.velocity.x < 0 && side == "right"))
			return false;
		if (this.position.y >= palaUpper && this.position.y <= palaLower)
		{
			if (side == "left" && this.position.x <= pala.	position.x + pala.width)
				return true;
			else if (side == "right" && this.position.x >= pala.position.x - pala.width)
				return true;
			else
				return false;
		}
		return false;
		
	}

	/* Checks wether the ball scores a point */
	isPoint()
	{
		if (this.position.x <= 0)
		{
			this.arrayScores[1]++;
			return true;
		}
		else if (this.position.x >= canvas.width)
		{
			this.arrayScores[0]++;
			return true;
		}
		else
			return false;
	}

	resetBall()
	{
		this.velocity = new Vector(ballSpeed, ballSpeed);
		this.position = new Vector(canvas.width / 2, canvas.height / 2 - 100);
		this.index = 0;
		this.color = "green";
	}

	darkenColor()
	{
		if (this.color != "black")
		{
			this.color = this.colors[this.index];
			this.index++;
		}
	}

	handleCollisions(palaLeft, palaRight)
	{
		if (this.position.y <= 0 || this.position.y >= canvas.height)
			this.velocity.invertVertical(); 
		else if (this.isPoint())
			this.resetBall();
		else if (this.isPalaLimit(palaLeft, "left") || this.isPalaLimit(palaRight, "right"))
		{
			this.velocity.invertHorizontal();
			this.velocity.scalarMult(1.3);
			this.darkenColor();
		}
	}
}