import json
import time
import math
import asyncio
import random
from core.socket import *

import logging
logger = logging.getLogger(__name__)

GAME_STATE      = 'game_state'
GAME_SCORE      = 'game_score'
GAME_END        = 'game_end'
WALL_COLLISON   = 'wall_collison',
PADDLE_COLLISON = 'paddle_collison',

class PongGame:
    def __init__(self, game_id, consumer):

        ##############################
        # ADJUST WITH FRONTEND SIZES #
        ##############################

        self.paddle_width       = 10  # Paddle Width
        self.paddle_height      = 40  # Paddle Height
        self.paddle_margin      = 2   # Paddle margin to edge
        self.canvas_x           = 400 # Canvas Width 
        self.canvas_y           = 200 # Canvas Height 
        self.ball_radius        = 5   # Ball Radious
        self.border_thickness   = 5   # Canvas frame border thickness (always 1/2 of lineWidth)

        self.points_to_win = 3
        ######
        self.game_id = game_id
        self.players = {}
        self.ball = {'x': self.canvas_x / 2, 'y': self.canvas_y / 2}
        # Set initial random angle and direction
        self.ball['speed_y'] = self.get_random_angle()
        self.ball['speed_x'] = self.get_random_direction()
        self.running = False
        self.consumer = consumer
        self.player1_paddle_x = 0 + self.border_thickness + self.paddle_margin
        self.player1_paddle_y = (self.canvas_y / 2) - (self.paddle_height / 2)
        self.player2_paddle_x = self.canvas_x - self.border_thickness - self.paddle_width - self.paddle_margin
        self.player2_paddle_y =  (self.canvas_y / 2) - (self.paddle_height / 2)

    async def start_game(self):
        self.running = True
        await self.send_game_state()

        while self.running:
            await self.detect_collisions()
            if self.running:
                return
            self.move_ball()
            # Send updated status to all players
            await self.send_game_state()
            # Wait a short period before the next update
            await asyncio.sleep(1 / 60)

    def reset_game(self, winner):
        self.ball = {'x': self.canvas_x / 2, 'y': self.canvas_y / 2}
        self.ball['speed_y'] = self.get_random_angle()
        # If left player win, next round start right and overwise
        self.ball['speed_x'] = 3
        if winner == 1:
            self.ball['speed_x'] = -3
        # Set paddle position to default
        for player_info in self.players.values():
            player_info['paddle_x'] = self.player1_paddle_x if player_info['nbr'] == 1 else self.player2_paddle_x
            player_info['paddle_y'] = self.player1_paddle_y if player_info['nbr'] == 1 else self.player2_paddle_y

    def move_ball(self):
        self.ball['x'] += self.ball['speed_x']
        self.ball['y'] += self.ball['speed_y']

    def get_random_angle(self):
        return random.uniform(-75 * math.pi / 180, 75 * math.pi / 180)  # -75 y 75 angle
    
    def get_random_direction(self):
        return random.choice([3, -3]) # Return 3 or -3

    async def detect_collisions(self):
        ball = self.ball
        
        left_side = 0 + self.border_thickness + self.ball_radius
        right_side = self.canvas_x - self.border_thickness - self.ball_radius
        top_side = 0 + self.border_thickness + self.ball_radius
        bottom_side = self.canvas_y - self.border_thickness - self.ball_radius
        
        for _, player in self.players.items():
            if self.check_paddle_collision(ball, player, self.paddle_width, self.paddle_height):
                await send_to_group(self.consumer, self.game_id, PADDLE_COLLISON, {})
                return

        # Collision with one of the sides of a player
        if ball['x'] <= left_side or ball['x'] >= right_side:
            players_list = list(self.players.values())
            # Determine winner
            if ball['x'] <= left_side:
                players_list[1]['score'] += 1
                winner = 1
            else:
                players_list[0]['score'] += 1
                winner = 0
            
            await self.send_game_score()
            if players_list[0]['score'] == self.points_to_win or players_list[1]['score'] == self.points_to_win:
                await self.send_game_end()
                self.running = False

            self.reset_game(winner)
            return
        
        # Collision detection with upper and lower walls
        if ball['y'] <= top_side or ball['y'] >= bottom_side:
            ball['speed_y'] *= -1  # Reverse direction on the y axis
            await send_to_group(self.consumer, self.game_id, WALL_COLLISON, {})
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
        # Calculate new ball velocities using magic, called by people who are intelligent "trigonometry"
        ball_speed = math.sqrt(ball['speed_x']**2 + ball['speed_y']**2)
        ball['speed_x'] = ball_speed * math.cos(bounce_angle)
        ball['speed_y'] = ball_speed * -math.sin(bounce_angle)
    
    async def send_game_state(self):
        # Send updated status to all players in the game
        await send_to_group(self.consumer, self.game_id, GAME_STATE, {'message': self.get_game_state()})
    
    async def send_game_end(self):
        # Send game finish
        players_list = list(self.players.values())
        scores = {0: players_list[0]['score'], 1: players_list[0]['score']}
        await send_to_group(self.consumer, self.game_id, GAME_END, {'message': scores})
    
    async def send_game_score(self):
        # Send players score
        players_list = list(self.players.values())
        scores = {0: players_list[0]['score'], 1: players_list[0]['score']}
        await send_to_group(self.consumer, self.game_id, GAME_SCORE, {'message': scores})

    def get_game_state(self):
        # Return the current state of the game bt exclude id and score
        players_without_id_score = {}
        for player_id, player_info in self.players.items():
            player_info_copy = player_info.copy()
            del player_info_copy['id']
            del player_info_copy['score']
            players_without_id_score[player_id] = player_info_copy

        return {
            'players': players_without_id_score,
            'ball': self.ball,
    }

    def add_player(self, player, player_number):
        if player_number == 1:
            self.players[player] = {'id': player, 'nbr': player_number, 'paddle_x': self.player1_paddle_x, 'paddle_y': self.player1_paddle_y, 'score': 0}
        else:
            self.players[player] = {'id': player, 'nbr': player_number, 'paddle_x': self.player2_paddle_x, 'paddle_y': self.player2_paddle_y, 'score': 0}
    
    def move_paddle(self, player_id, direction):
        if player_id in self.players:
            player = self.players[player_id]
            paddle_y = player['paddle_y']
            # Prevent move out of bounds
            if (paddle_y + int(direction)) >= 0 + self.border_thickness and (paddle_y + self.paddle_height + int(direction)) <= self.canvas_y - self.border_thickness:
                player['paddle_y'] += int(direction)
    
    def remove_player(self, player_id):
        if player_id in self.players:
            del self.players[player_id]
            if not self.players:
                self.running = False