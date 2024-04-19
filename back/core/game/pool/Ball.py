import numpy as np
import random
import math
from core.socket import *

import logging
logger = logging.getLogger(__name__)

class Ball:
    def __init__(self, main, x = 0.0, z = 0.0, radius = 0.3075, number = 0, stripe = False):
        self.stripe = stripe
        self.radius = radius
        self.poketCornerRadious = 0.8
        self.poketMiddleRadious = 0.6 
        self.position = np.array([x, radius, z])
        self.mass = 1
        self.restitution = {
            "ball": 0.95,
            "wall": 0.8
        }
        self.number = number
        self.main = main

        self.nextPosition = self.position
        self.speed = np.array([0.0, 0.0, 0.0])
        self.rollFriction = 0.6
        self.ballLoop = False
        
    def setSpeed(self, speed):
        self.speed = speed
        self.nextPosition = self.position
        self.nextPosition = self.position + self.speed


        if self.ballLoop == False:
            self.main.movingBalls += 1
            self.ballLoop = self.main.loop.add(self.moveBall)

    async def moveBall(self):
        self.speed = self.speed * (1 - self.rollFriction / self.main.tps)
        stopThreshold = 0.001
        
        if np.linalg.norm(self.speed) < stopThreshold:
            self.speed = np.array([0.0, 0.0, 0.0])
            self.main.movingBalls -= 1
            if self.main.movingBalls == 0:
                await self.main.switchPlayer()
            self.ballLoop = self.main.loop.remove(self.ballLoop)
        else:
            self.currentPosition = self.nextPosition
            
            # Check Wall collisson
            collideType = self.willCollideWall()
            if collideType >= 2:
                #Get direction
                magnitude = math.sqrt(self.speed[0] ** 2 + self.speed[2] ** 2)
                directionX = self.speed[0] / magnitude
                directionY = 0
                directionZ = self.speed[2] / magnitude
                normaliced = [directionX, directionY, directionZ]
                #Bounce based on direction
                if (collideType == 2 and directionX < 0) or (collideType == 3 and directionX > 0):
                    self.speed[0] = self.speed[0] * -1
                if (collideType == 4 and directionZ > 0) or (collideType == 5 and directionZ < 0):
                    self.speed[2] = self.speed[2] * -1
                #Collison restitution
                speedTowardsTarget = np.multiply(self.speed, normaliced)
                speedLength = np.linalg.norm(speedTowardsTarget)
                if speedLength > 0.05:
                    frequency = 2 * np.linalg.norm(self.speed)
                    frequency = min(0.6, frequency)
                    self.speed = self.speed * self.restitution['wall']
                    # send play sound
                    await send_to_group(self.main.consumer, self.main.game_id, "sound", frequency)
                    
            elif collideType == 1:
                await self.ballInPocket()
                return

            self.position = self.currentPosition
            self.nextPosition = self.currentPosition + self.speed
    
    def willCollideWall(self):

        table_half_x = self.main.tableSize["x"] / 2
        table_half_z = self.main.tableSize["z"] / 2

        # Top left
        if self.nextPosition[0] <= -table_half_x + self.radius and (self.nextPosition[2] <= table_half_z - self.poketCornerRadious and self.nextPosition[2] >= self.poketMiddleRadious):
            return 2
        # Top right
        if self.nextPosition[0] <= -table_half_x + self.radius and (self.nextPosition[2] <= -self.poketMiddleRadious and self.nextPosition[2] >= -table_half_z + self.poketCornerRadious):
            return 2
        # Bottom left
        if self.nextPosition[0] >= table_half_x - self.radius and (self.nextPosition[2] <= table_half_z - self.poketCornerRadious and self.nextPosition[2] >= self.poketMiddleRadious):
            return 3
        #Bottom right
        if self.nextPosition[0] >= table_half_x - self.radius and (self.nextPosition[2] <= -self.poketMiddleRadious and self.nextPosition[2] >= -table_half_z + self.poketMiddleRadious):
            return 3
        #Left
        if self.nextPosition[2] >= table_half_z - self.radius and (self.nextPosition[0] >= -table_half_x + self.poketCornerRadious and self.nextPosition[0] <= table_half_x - self.poketCornerRadious):
            return 4
        #Right
        if self.nextPosition[2] <= -table_half_z + self.radius and (self.nextPosition[0] >= -table_half_x + self.poketCornerRadious and self.nextPosition[0] <= table_half_x - self.poketCornerRadious):
            return 5
            
        #########
        # Holes #
        #########
        if self.nextPosition[0] - self.radius <= -table_half_x or self.nextPosition[0] + self.radius >= table_half_x:
            return 1
        
        if self.nextPosition[2] - self.radius <= -table_half_z or self.nextPosition[2] + self.radius >= table_half_z:
            return 1
    
        return 0
    
    async def resolve_collision(self, ball):
        # Delta vector and distance between ball positions
        delta = self.position - ball.position
        distance = np.linalg.norm(delta)
        overlap = distance - (self.radius + ball.radius)

        # If overlap, adjust positions
        if overlap < 0:
            # Normalize delta vector and multiply by overlap distance
            adjustment = delta / distance * overlap
            self.position -= adjustment
            self.position[1] = self.radius

        # # Delta vector and distance between ball positions
        # delta = self.position - ball.position
        # distance = np.linalg.norm(delta)
        # distance -= self.radius + ball.radius

        # # If overlap, adjust positions
        # if distance < 0:
        #     self.position -= delta / np.linalg.norm(delta) * distance
        
        # Sound
        hitSpeed = ball.speed - self.speed
        hitSpeed[0] = abs(hitSpeed[0])
        hitSpeed[1] = abs(hitSpeed[1])
        hitSpeed[2] = abs(hitSpeed[2])
        frequency = 0.3 + (np.linalg.norm(hitSpeed) / 0.3 * (0.75 + random.random() / 2)) / 1.5
        await send_to_group(self.main.consumer, self.main.game_id, "sound", frequency)

        # Collison angle
        dx = self.nextPosition[0] - ball.nextPosition[0]
        dy = self.nextPosition[2] - ball.nextPosition[2]
        collision_angle = math.atan2(dy, dx)

        # Final end speed of balls
        speed1 = np.linalg.norm(self.speed)
        speed2 = np.linalg.norm(ball.speed)
        direction1 = math.atan2(self.speed[2], self.speed[0])
        direction2 = math.atan2(ball.speed[2], ball.speed[0])

        velocityx_1 = speed1 * math.cos(direction1 - collision_angle)
        velocityy_1 = speed1 * math.sin(direction1 - collision_angle)
        velocityx_2 = speed2 * math.cos(direction2 - collision_angle)
        velocityy_2 = speed2 * math.sin(direction2 - collision_angle)

        final_velocityx_1 = ((self.mass - ball.mass) * velocityx_1 + (ball.mass + ball.mass) * velocityx_2) / (self.mass + ball.mass)
        final_velocityx_2 = ((self.mass + self.mass) * velocityx_1 + (ball.mass - self.mass) * velocityx_2) / (self.mass + ball.mass)
        final_velocityy_1 = velocityy_1
        final_velocityy_2 = velocityy_2

        # Update ball speed
        self.speed[0] = math.cos(collision_angle) * final_velocityx_1 + math.cos(collision_angle + math.pi / 2) * final_velocityy_1
        self.speed[2] = math.sin(collision_angle) * final_velocityx_1 + math.sin(collision_angle + math.pi / 2) * final_velocityy_1
        ball.speed[0] = math.cos(collision_angle) * final_velocityx_2 + math.cos(collision_angle + math.pi / 2) * final_velocityy_2
        ball.speed[2] = math.sin(collision_angle) * final_velocityx_2 + math.sin(collision_angle + math.pi / 2) * final_velocityy_2

        # Coeficient to speed
        self.speed = self.speed * self.restitution["ball"]
        ball.speed = ball.speed * ball.restitution["ball"]

        # Update speed and push
        self.setSpeed(self.speed)
        ball.setSpeed(ball.speed)

    def direction_to(self, ball):
        return np.linalg.norm(ball.nextPosition - self.nextPosition)
    
    def distance_to(self, point1, point2):
        return np.linalg.norm(point1 - point2)
    
    def colliding(self, ball):
        distance = self.distance_to(self.nextPosition, ball.nextPosition)
        return distance < ball.radius + self.radius
    
    async def ballInPocket(self):
        # Simple rules
        if self.number == 0:
            self.main.placeWhite = True
            # await self.main.freeBall()
        else:
            self.main.balls.remove(self)

        # Check reaming balls to set winner and ball type to check if it's fault/continue playing
        await self.main.checkGame(self)
        
        players_list = list(self.main.players.values())
        await send_to_group(self.main.consumer, self.main.game_id, "poket", {
            "ballNumber": self.number,
            "user1Balls": players_list[0]["stripe"],
            "user2Balls": players_list[1]["stripe"]
        })
        self.speed = np.array([0.0, 0.0, 0.0])
        