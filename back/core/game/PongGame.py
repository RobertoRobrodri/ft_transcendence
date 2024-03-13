import json
import time
import math
import asyncio
from core.socket import *

import logging
logger = logging.getLogger(__name__)

GAME_STATE = 'game_state'

class PongGame:
    def __init__(self, game_id, consumer):

        # ADJUST WITH FRONTEND SIZES
        self.paddle_width = 10
        self.paddle_height = 40
        self.canvas_x = 400
        self.canvas_y = 200
        self.ball_radius = 5

        ######
        self.game_id = game_id
        self.players = {}
        self.ball = {'x': self.canvas_x / 2, 'y': self.canvas_y / 2, 'speed_x': 3, 'speed_y': 3}
        self.running = False
        self.consumer = consumer
        self.points = 0
        self.player1_paddle_x = 0
        self.player1_paddle_y = (self.canvas_y / 2) + (self.paddle_width / 2)
        self.player2_paddle_x = self.canvas_x - self.paddle_width
        self.player2_paddle_y =  (self.canvas_y / 2) + (self.paddle_width / 2)

    async def start_game(self):
        self.running = True
        await self.send_game_state()

        while self.running:
            self.move_ball()
            self.detect_collisions()

            # Send updated status to all players
            await self.send_game_state()

            # Wait a short period before the next update
            await asyncio.sleep(1 / 60)

    def reset_game(self):
        self.ball = {'x': self.canvas_x / 2, 'y': self.canvas_y / 2, 'speed_x': 2, 'speed_y': 2}
        for i in range(2):
            player_info = list(self.players.values())[i]
            if i == 0:
                player_info['paddle_x'] = self.player1_paddle_x
                player_info['paddle_y'] = self.player1_paddle_y
            elif i == 1:
                player_info['paddle_x'] = self.player2_paddle_x
                player_info['paddle_y'] = self.player2_paddle_y

    def move_ball(self):
        self.ball['x'] += self.ball['speed_x']
        self.ball['y'] += self.ball['speed_y']

    def detect_collisions(self):
        ball = self.ball
        
        left_side = 0 + self.ball_radius
        right_side = self.canvas_x - self.ball_radius
        top_side = 0 + self.ball_radius
        bottom_side = self.canvas_y - self.ball_radius
        
        for _, player in self.players.items():
            if self.check_paddle_collision(ball, player, self.paddle_width, self.paddle_height):
                # ball['speed_x'] *= -1  # Invertir la dirección en el eje x
                logger.warning(f'Collide with paddle 1: ball x = {ball["x"]}  ball y = {ball["y"]}')
                # time.sleep(2)
                return

        # Detect point to player X
        if ball['x'] <= left_side or ball['x'] >= right_side:
            logger.warning(f'Point!!')
            self.reset_game()
            return
        
        # Collision detection with upper and lower walls
        if ball['y'] <= top_side or ball['y'] >= bottom_side:
            ball['speed_y'] *= -1  # Reverse direction on the y axis
            return
    
    def check_paddle_collision(self, ball, player, paddle_width, paddle_height):
        paddle_x = player['paddle_x']
        paddle_y = player['paddle_y']
        player_nbr = player['nbr']
        ball_x_check = ball['x'] + self.ball_radius >= paddle_x
        if player_nbr == 1:
            ball_x_check = ball['x'] - self.ball_radius <= paddle_x + paddle_width
        # Check collision with left paddle
        if (ball_x_check and ball['y'] >= paddle_y and ball['y'] <= paddle_y + paddle_height):
            # Determine the impact zone on the paddle
            impact_zone = (ball['y'] - paddle_y + paddle_height / 2) / (paddle_height / 2)
            logger.warning(f'impact_zone {impact_zone}')

            # Change ball's direction based on impact zone
            self.handle_paddle_collision(ball, paddle_y)
            return True

        return False
    
    def handle_paddle_collision(self, ball, paddle_y):
        # Determine the impact zone on the paddle
        relative_intersect_y = (paddle_y + self.paddle_height / 2) - ball['y']
        
        # Normalize the relative intersection
        normalized_relative_intersect_y = relative_intersect_y / (self.paddle_height / 2)
        
        # Calculate bounce angle
        # bounce_angle = normalized_relative_intersect_y * (5 * math.pi / 12)  # 75 degrees
        bounce_angle = math.atan2(normalized_relative_intersect_y, 1)
        
        # Adjust the angle based on the paddle's side
        if ball['speed_x'] > 0:
            bounce_angle = math.pi - bounce_angle
        
        # Calculate new ball velocities using trigonometry
        ball_speed = math.sqrt(ball['speed_x']**2 + ball['speed_y']**2)
        ball['speed_x'] = ball_speed * math.cos(bounce_angle)
        ball['speed_y'] = ball_speed * -math.sin(bounce_angle)

        logger.warning(f'Relative Intersect Y: {relative_intersect_y}, Normalized Relative Intersect Y: {normalized_relative_intersect_y}, Bounce Angle: {bounce_angle}, New SpeedX: {ball["speed_x"]}, New SpeedY: {ball["speed_y"]}')

    
    async def send_game_state(self):
        # Send updated status to all players in the game
        await send_to_group(self.consumer, self.game_id, GAME_STATE, {'message': self.get_game_state()})

    def get_game_state(self):
        # Return the current state of the game
        return {
            'players': self.players,
            'ball': self.ball,
        }

    def add_player(self, player, player_number):
        if player_number == 1:
            self.players[player] = {'id': player, 'nbr': player_number, 'paddle_x': self.player1_paddle_x, 'paddle_y': self.player1_paddle_y}
        else:
            self.players[player] = {'id': player, 'nbr': player_number, 'paddle_x': self.player2_paddle_x, 'paddle_y': self.player2_paddle_y}
    
    def move_paddle(self, player_id, direction):
        if player_id in self.players:
            player = self.players[player_id]
            paddle_y = player['paddle_y']
            # Prevent move out of bounds
            if (paddle_y + int(direction)) >= 0 and (paddle_y + self.paddle_height + int(direction)) <= self.canvas_y:
                player['paddle_y'] += int(direction)
    
    def remove_player(self, player_id):
        if player_id in self.players:
            del self.players[player_id]
            if not self.players:
                self.running = False