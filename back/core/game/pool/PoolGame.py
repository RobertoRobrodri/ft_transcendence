import asyncio
from threading import Timer
import numpy as np
import math
import quaternion
from core.socket import *
from ..models import Game
from ..models import CustomUser
from ..game_state import games
from .Ball import Ball
from .GameLoop import GameLoop

import logging
logger = logging.getLogger(__name__)

GAME_STATE      = 'game_state'
GAME_SCORE      = 'game_score'
GAME_END        = 'game_end'

INIT_STATE      = 'init_state'
ROTATE_CUE      = 'rotate_cue'
MOVE_CUE        = 'move_cue'
WALL_COLLISON   = 'wall_collison',
PADDLE_COLLISON = 'paddle_collison',

class PoolGame:
    def __init__(self, game_id, consumer, tournament_id = None):
        self.game_id = game_id
        self.tps = 120
        self.ballRadious = 0.3075
        self.allowShoot = False
        self.turnPlayer = 0
        self.players = {}
        self.scores = [0, 0]
        self.running = False
        self.consumer = consumer
        self.movingBalls = 0
        self.maxPower = self.ballRadious * self.tps * 1.5
        self.cue = {
            "position": {"x": 0.0, "y": self.ballRadious, "z": -6.75},
            "rotation": {"x": 0.0, "y": 0.0, "z": 0.0},
            "quaternion": {"x": 0.0, "y": 0.0, "z": 0.0, "w": 1.0}
        }
        self.loop = GameLoop(self)

        self.balls = [

            # -0.3299250064679542, 0.2934688325322231, 3.6324840171337165
            # 0.20024239809600408, 0.3075, 6.761869770776174
            Ball(self, -0.3299250064679542, 3.6324840171337165),
            Ball(self, 0.20024239809600408, 6.761869770776174, self.ballRadious, 1, False),


            # Ball(self, 0.0, -13.5 / 2),

            # Ball(self, 0.0, 4 + 2.75, self.ballRadious, 1, False),

            # Ball(self, -0.32, 4.6 + 2.75, self.ballRadious, 3, True),
            # Ball(self, 0.32, 4.6 + 2.75, self.ballRadious, 11, True),

            # Ball(self, 0, 5.2 + 2.75, self.ballRadious, 8, False),
            # Ball(self, 0.64, 5.2 + 2.75, self.ballRadious, 6, False),
            # Ball(self, -0.64, 5.2 + 2.75, self.ballRadious, 14, True),

            # Ball(self, 0.32, 5.8 + 2.75, self.ballRadious, 15, True),
            # Ball(self, -0.32, 5.8 + 2.75, self.ballRadious, 4, False),
            # Ball(self, 0.96, 5.8 + 2.75, self.ballRadious, 13, True),
            # Ball(self, -0.96, 5.8 + 2.75, self.ballRadious, 9, True),

            # Ball(self, 0, 6.4 + 2.75, self.ballRadious, 10, True),
            # Ball(self, 0.64, 6.4 + 2.75, self.ballRadious, 2, False),
            # Ball(self, -0.64, 6.4 + 2.75, self.ballRadious, 5, False),
            # Ball(self, 1.28, 6.4 + 2.75, self.ballRadious, 7, False),
            # Ball(self, -1.28, 6.4 + 2.75, self.ballRadious, 12, True)
        ]

        self.tableSize = {
            "z": 27,
            "x": 13.5,
        }
    
    async def gameLoop(self):
        all_balls = []
        for i in range(len(self.balls)):
            all_balls.append(self.balls[i].position.tolist())
            for j in range(i + 1, len(self.balls)):
                if self.balls[i].colliding(self.balls[j]):
                    await self.balls[i].resolve_collision(self.balls[j])
        
        if self.movingBalls != 0:
            await send_to_group(self.consumer, self.game_id, "move_ball", all_balls)
            
    async def send_balls_position(self):
        ball_info_array = []
        for ball in self.balls:
            if ball.position[1] == self.ballRadious:
                ball_info = {
                    "stripe": ball.stripe,
                    "radius": ball.radius,
                    "position": ball.position.tolist(),
                    "number": ball.number,
                    "currentRotation": ball.currentRotation,
                    "speed": ball.speed.tolist()
                }
                ball_info_array.append(ball_info)
        await send_to_group(self.consumer, self.game_id, INIT_STATE, ball_info_array)
    
    async def start_game(self):
        # Waiting 2 players set ready status
        logger.warning(f"start_game")
        try:
            await asyncio.wait_for(self.wait_for_players_ready(), timeout=30)
        except asyncio.TimeoutError:
            self.running = False
            del games[self.game_id]
            logger.warning("Players are not ready after 30 seconds. Leaving game.")
            return
        
        await self.send_balls_position()
        self.allowShoot = True
        await asyncio.sleep(2)
        self.loop.add(self.gameLoop)
        await self.loop.start()
        
    async def wait_for_players_ready(self):
        # Esperar a que los jugadores estén listos
        while not self.running:
            logger.warning(f"game waiting")
            await self.are_players_ready()
            await asyncio.sleep(1)

    async def are_players_ready(self):
        players_list = list(self.players.values())
        if len(players_list) < 2:
            return
        ready_count = 0
        for player in players_list:
            if player['ready']:
                ready_count += 1
        if ready_count == len(players_list):
            self.running = True

    def add_player(self, username, userid, player_number):
        self.players[userid] = {'username': username, 'userid': userid, 'nbr': player_number, 'ready': False, "power": self.maxPower, "nbr": player_number - 1}
    
    async def player_ready(self, userid):
        if userid in self.players:
            self.players[userid]['ready'] = True
    
    async def execute_action(self, userid, action):
        if userid in self.players:
            player = self.players[userid]
            if len(self.balls) < 1 or self.allowShoot == False:
                return
            if self.turnPlayer != player["nbr"]:
                return
            if action == "shoot":
                await self.shoot(userid)
                return
            cueRotate = action.get("rotateCue")
            cuePower = action.get("power")
            if cueRotate is not None:
                await self.setCueRotation(cueRotate)
            elif cuePower is not None:
                await self.setCuePower(cuePower, userid)
    
    async def shoot(self, userid):
        self.allowShoot = False
        #cue rotation
        cueX = self.cue["rotation"]["x"]
        cueY = self.cue["rotation"]["y"]
        rotation = cueY
        if cueX == math.pi:
            rotation = math.pi - rotation
        if cueX < -1:
            rotation = math.pi - rotation
        elif cueY < 0:
            rotation = 2 * math.pi + rotation
                
        x = math.cos(rotation)
        z = math.sin(rotation)
        self.speed = np.array([z, 0, x])
        power = self.players[userid]["power"] / self.tps
        self.speed *= power
        await send_to_group(self.consumer, self.game_id, "shoot", power)
        def set_ball_speed():
            self.balls[0].setSpeed(self.speed) 
        t = Timer(0.5 + (0.06 / power / 1.9), set_ball_speed) # await 1 second to sync with front animation
        t.start()
        
    async def setCueRotation(self, cueRotate):
        new_rotation_quaternion = self.rotate_quaternion(cueRotate, self.cue["quaternion"])
        self.cue["quaternion"] = {
            "x": new_rotation_quaternion.x,
            "y": new_rotation_quaternion.y,
            "z": new_rotation_quaternion.z,
            "w": new_rotation_quaternion.w
        }
        ex, ey, ez = self.euler_from_quaternion(self.cue["quaternion"])
        self.cue["rotation"] = {
            "x": ex,
            "y": ey,
            "z": ez
        }
        await send_to_group(self.consumer, self.game_id, ROTATE_CUE, self.cue["quaternion"])

    async def setCuePower(self, cuePower, userid):
        self.players[userid]["power"] += cuePower
        self.players[userid]["power"] = max(6, min(self.players[userid]["power"], self.maxPower))
        await send_to_group(self.consumer, self.game_id, "cue_power", self.players[userid]["power"])
        

    async def switchPlayer(self):
        await send_to_group(self.consumer, self.game_id, "switch_player", self.balls[0].position.tolist())
        def enableShoot():
            self.allowShoot = True
        t = Timer(1, enableShoot) # await 1 second to sync with front animation
        t.start()
        self.turnPlayer = (self.turnPlayer + 1) % 2

    async def restore(self):
        await self.send_balls_position()

    def rotate_quaternion(self, rotation_speed, current_quaternion):
        rotation_increment = rotation_speed
        q1 = np.quaternion(current_quaternion["w"], current_quaternion["x"], current_quaternion["y"], current_quaternion["z"])
        rotation_quaternion = quaternion.from_rotation_vector([0, rotation_increment, 0])
        new_rotation_quaternion = q1 * rotation_quaternion
        return new_rotation_quaternion
    
    def euler_from_quaternion(self, quaternion):
        x = quaternion["x"]
        y = quaternion["y"]
        z = quaternion["z"]
        w = quaternion["w"]

        t0 = +2.0 * (w * x + y * z)
        t1 = +1.0 - 2.0 * (x * x + y * y)
        roll_x = math.atan2(t0, t1)

        t2 = +2.0 * (w * y - z * x)
        t2 = +1.0 if t2 > +1.0 else t2
        t2 = -1.0 if t2 < -1.0 else t2
        pitch_y = math.asin(t2)

        t3 = +2.0 * (w * z + x * y)
        t4 = +1.0 - 2.0 * (y * y + z * z)
        yaw_z = math.atan2(t3, t4)
        return roll_x, pitch_y, yaw_z
    
    #############################
    ## FUNCTIONS TO STORE DATA ##
    #############################
                
    async def save_game_result(self, players_list, winner):
        user1   = await CustomUser.get_user_by_id(players_list[0]['userid'])
        user2   = await CustomUser.get_user_by_id(players_list[1]['userid'])
        winner  = user1 if winner == 0 else user2
        loser   = user2 if winner == user1 else user1
        # Add match to db
        await Game.store_match(user1, user2, winner, self.scores)
        # Increment win in 1
        await CustomUser.user_win(winner)
        # Increment loss in 1
        await CustomUser.user_lose(loser)