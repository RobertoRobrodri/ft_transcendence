from channels.layers import get_channel_layer
import math
import asyncio
import random
from core.socket import *
from .models import Game
from .models import CustomUser
from .game_state import games, tournaments

import logging
logger = logging.getLogger(__name__)

GAME_STATE      = 'game_state'
GAME_SCORE      = 'game_score'
GAME_END        = 'game_end'
WALL_COLLISON   = 'wall_collison'
PADDLE_COLLISON = 'paddle_collison'
COUNTDOWN       = 'countdown'

class PongGame:
    def __init__(self, game_id, consumer, tournament_id = None):

        ##############################
        # ADJUST WITH FRONTEND SIZES #
        ##############################

        self.paddle_width       = 10  # Paddle Width
        self.paddle_height      = 40  # Paddle Height
        self.paddle_margin      = 2   # Paddle margin to edge
        self.canvas_x           = 400 # Canvas Width 
        self.canvas_y           = 200 # Canvas Height 
        self.ball_radius        = 5   # Ball Radious
        self.border_thickness   = 0   # Canvas frame border thickness (always 1/2 of lineWidth)
        self.sleep_match        = 5   # Seconds of pause at start of game
        self.sleep              = 1   # Seconds of pause between each point
        self.ball_speed         = 3   # Base ball speed
        self.inc_ball_speed     = 1   # Increment of ball speed
        self.max_ball_speed     = 6   # Base ball speed
        self.paddle_speed       = 2   # Speed of paddles

        self.points_to_win      = 6
        ######
        self.game_id = game_id
        self.players = {}
        self.scores = [0, 0]
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
        self.tournament_id = tournament_id
        # del games[self.game_id]

    async def start_game(self):
        # Waiting 2 players set ready status
        try:
            await asyncio.wait_for(self.wait_for_players_ready(), timeout=20)
            await asyncio.wait_for(self.countdown(), timeout=self.sleep_match + 3)

        except asyncio.TimeoutError:
            self.running = False
            del games[self.game_id]
            logger.warning("Players are not ready after 30 seconds. Leaving game.")
            return
            
        # Main Game while
        while self.running:
            await self.detect_collisions()
            # If game finish, exit
            if not self.running:
                return
            self.move_ball()
            # Send updated status to all players
            await self.send_game_state()
            # Wait a short period before the next update
            await asyncio.sleep(1 / 60)
    
    async def countdown(self):
        i = 0
        while True:
            await send_to_group(self.consumer, self.game_id, COUNTDOWN, {"counter": i})
            i += 1
            if i >= self.sleep_match:
                return
            await asyncio.sleep(1)

            
    async def wait_for_players_ready(self):
        # Esperar a que los jugadores estén listos
        while not self.running:
            await self.send_game_state()
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
    
    async def checkEndGame(self, players_list, winner):
        if self.scores[0] == self.points_to_win or self.scores[1] == self.points_to_win:
            await self.send_game_end()
            if self.tournament_id is None:
                await self.save_game_result(players_list, winner)
            else:
                await self.set_game_tournament_points()
                await self.set_winner_tournament(players_list, winner)
            self.running = False
            del games[self.game_id]
            await self.consumer.sendlistGamesToAll("Pong")
    
    async def reset_game(self, winner):
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
        
        await asyncio.sleep(self.sleep)

    def move_ball(self):
        self.ball['x'] += self.ball['speed_x']
        self.ball['y'] += self.ball['speed_y']

    def get_random_angle(self):
        return random.uniform(-75 * math.pi / 180, 75 * math.pi / 180)  # -75 y 75 angle
    
    def get_random_direction(self):
        return random.choice([self.ball_speed, self.ball_speed * -1]) # Return 3 or -3

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
                self.scores[1] += 1
                winner = 1
            else:
                self.scores[0] += 1
                winner = 0
            
            await self.send_game_score()                    # Send current score
            await self.checkEndGame(players_list, winner)   # Check if game end
            await self.reset_game(winner)                   # Reset Game
            return
        
        # Collision detection with upper and lower walls
        if (ball['y'] <= top_side and ball['speed_y'] < 0) or (ball['y'] >= bottom_side and ball['speed_y'] > 0):
            ball['speed_y'] *= -1  # Reverse direction on the y axis
            await send_to_group(self.consumer, self.game_id, WALL_COLLISON, {})
            return
        # if ball['y'] <= top_side or ball['y'] >= bottom_side:
        #     ball['speed_y'] *= -1  # Reverse direction on the y axis
        #     await send_to_group(self.consumer, self.game_id, WALL_COLLISON, {})
        #     return
    
    def check_paddle_collision(self, ball, player, paddle_width, paddle_height):
        paddle_x = player['paddle_x']
        paddle_y = player['paddle_y']
        player_nbr = player['nbr']

        # Calcular los límites de la pala
        paddle_left = paddle_x
        paddle_right = paddle_x + paddle_width
        paddle_top = paddle_y
        paddle_bottom = paddle_y + paddle_height
        
        # Prevent ball stuck between paddle and top/bottom
        if player_nbr == 1 and ball['speed_x'] > 0:
            return False
        elif player_nbr == 2 and ball['speed_x'] < 0:
            return False
        
        # If middle of ball through inner side of paddle, then don't collide
        if player_nbr == 1 and ball['x'] < paddle_right - 2:
            return False
        elif player_nbr == 2 and ball['x'] > paddle_left + 2:
            return False
        
        # Check if the ball is within the limits of the paddle
        if (paddle_left <= ball['x'] + self.ball_radius <= paddle_right or
            paddle_left <= ball['x'] - self.ball_radius <= paddle_right) and \
            (paddle_top <= ball['y'] + self.ball_radius <= paddle_bottom or
            paddle_top <= ball['y'] - self.ball_radius <= paddle_bottom):
            
            # Change the direction of the ball based on the impact zone
            self.handle_paddle_collision(ball, paddle_y)
            return True

        return False
    
    # def check_paddle_collision(self, ball, player, paddle_width, paddle_height):
    #     paddle_x = player['paddle_x']
    #     paddle_y = player['paddle_y']
    #     player_nbr = player['nbr']
    #     ball_x_check = ball['x'] + self.ball_radius >= paddle_x
    #     if player_nbr == 1:
    #         ball_x_check = ball['x'] - self.ball_radius <= paddle_x + paddle_width
    #     # Check collision with left paddle
    #     if (ball_x_check and ball['y'] >= paddle_y and ball['y'] <= paddle_y + paddle_height):
    #         # Change ball's direction based on impact zone
    #         self.handle_paddle_collision(ball, paddle_y)
    #         return True

    #     return False

    def handle_paddle_collision(self, ball, paddle_y):
        # Determine the impact zone on the paddle
        relative_intersect_y = (paddle_y + self.paddle_height / 2) - ball['y']
        # Normalize the relative intersection
        normalized_relative_intersect_y = relative_intersect_y / (self.paddle_height / 2)
        # Calculate bounce angle
        bounce_angle = math.atan2(normalized_relative_intersect_y, 1)
        # Limit bounce angle to maximum 75 degrees
        max_bounce_angle = math.radians(75)  # Convert 75 degrees to radians
        bounce_angle = min(abs(bounce_angle), max_bounce_angle) * math.copysign(1, bounce_angle)
        # Adjust the angle based on the paddle's side
        if ball['speed_x'] > 0:
            bounce_angle = math.pi - bounce_angle
        # Speed base
        ball_speed = math.sqrt(ball['speed_x']**2 + ball['speed_y']**2)
        # Increase speed based on initial angle and final angle
        if (ball['speed_y'] > 0 and math.sin(bounce_angle) > 0) or (ball['speed_y'] < 0 and math.sin(bounce_angle) < 0):
            ball_speed = max(ball_speed - self.inc_ball_speed, self.ball_speed)
        else:
            ball_speed = min(ball_speed + self.inc_ball_speed, self.max_ball_speed)

        new_speed_x = ball_speed * math.cos(bounce_angle)
        new_speed_y = ball_speed * -math.sin(bounce_angle)
        ball['speed_x'] = new_speed_x
        ball['speed_y'] = new_speed_y
    
    async def send_game_state(self):
        # Send updated status to all players in the game
        await send_to_group(self.consumer, self.game_id, GAME_STATE, self.get_game_state())
    
    async def send_game_end(self):
        # Send game finish
        scores = {0: self.scores[0], 1: self.scores[1]}
        await send_to_group(self.consumer, self.game_id, GAME_END, scores)
    
    async def send_game_score(self):
        # Send players score
        scores = {0: self.scores[0], 1: self.scores[1]}
        await send_to_group(self.consumer, self.game_id, GAME_SCORE, scores)

    def get_game_state(self):
        # Return the current state of the game bt exclude id and score
        players_without_id_score = {}
        for player_id, player_info in self.players.items():
            player_info_copy = player_info.copy()
            players_without_id_score[player_id] = player_info_copy
        return {
            'players'   : players_without_id_score,
            'ball'      : self.ball,
        }

    def add_player(self, username, userid, player_number):
        if player_number == 1:
            self.players[userid] = {'username': username, 'userid': userid, 'nbr': player_number, 'paddle_x': self.player1_paddle_x, 'paddle_y': self.player1_paddle_y, 'ready': False}
        else:
            self.players[userid] = {'username': username, 'userid': userid, 'nbr': player_number, 'paddle_x': self.player2_paddle_x, 'paddle_y': self.player2_paddle_y, 'ready': False}
    
    async def player_ready(self, userid):
        if userid in self.players:
            self.players[userid]['ready'] = True

    async def execute_action(self, userid, action):
        if userid in self.players:
            player = self.players[userid]
            paddle_y = player['paddle_y']
            # Prevent move out of bounds
            if (paddle_y + int(action)) >= 0 + self.border_thickness and (paddle_y + self.paddle_height + int(action)) <= self.canvas_y - self.border_thickness:
                player['paddle_y'] += int(action) * self.paddle_speed
    
    async def restore(self): #Not used here
        return
    
    async def userLeave(self, userId): #Not used here
        return
            
    def remove_player(self, userid):
        if userid in self.players:
            del self.players[userid]
            if not self.players:
                self.running = False

    
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
    
    async def set_game_tournament_points(self):
        current_round = tournaments[self.tournament_id]['rounds'][-1]
        for round in current_round:
            for player_data in round:
                userid = player_data['userid']
                player = self.players.get(userid)
                if player:
                    player_number = player['nbr']
                    score_index = player_number - 1
                    player_data['points'] = self.scores[score_index]
    
    async def set_winner_tournament(self, players_list, winner):
        if self.tournament_id is not None:
            winner_id = players_list[winner]['userid']  # Obtener el ID del ganador
            for idx, participants in enumerate(tournaments[self.tournament_id]['rounds'][-1]):
                for idx2, p in enumerate(participants):# for participant in participants:
                    if p['userid'] == winner_id:
                        tournaments[self.tournament_id]["rounds"][-1][idx][idx2]['winner'] = True
                        break
            await self.consumer.start_next_round(self.tournament_id)
        