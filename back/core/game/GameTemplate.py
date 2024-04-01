import json
import time
import math
import asyncio
import random
from core.socket import *
from .models import Game
from .models import CustomUser
from .game_state import games

import logging
logger = logging.getLogger(__name__)

GAME_STATE      = 'game_state'
GAME_SCORE      = 'game_score'
GAME_END        = 'game_end'
WALL_COLLISON   = 'wall_collison',
PADDLE_COLLISON = 'paddle_collison',

class PongGame:
    def __init__(self, game_id, consumer):
        self.game_id = game_id
        self.players = {}
        self.scores = [0, 0]
        self.running = False
        self.consumer = consumer

    async def start_game(self):
        # Waiting 2 players set ready status
        try:
            await asyncio.wait_for(self.wait_for_players_ready(), timeout=30)
        except asyncio.TimeoutError:
            self.running = False
            del games[self.game_id]
            logger.warning("Players are not ready after 30 seconds. Leaving game.")
            return
            
        # Main Game while
        while self.running:
            # Main loop
            # Wait a short period before the next update
            await asyncio.sleep(1 / 60)
    
    async def wait_for_players_ready(self):
        # Esperar a que los jugadores estén listos
        while not self.running:
            await self.send_game_state()
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
        # if player_number == 1:
        #     self.players[userid] = {'username': username, 'userid': userid, 'nbr': player_number, 'paddle_x': self.player1_paddle_x, 'paddle_y': self.player1_paddle_y, 'ready': False}
        # else:
        #     self.players[userid] = {'username': username, 'userid': userid, 'nbr': player_number, 'paddle_x': self.player2_paddle_x, 'paddle_y': self.player2_paddle_y, 'ready': False}
        pass
    
    async def player_ready(self, userid):
        if userid in self.players:
            self.players[userid]['ready'] = True

    def execute_action(self, userid, action):
        pass
    
    def remove_player(self, userid):
        pass

    
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


        