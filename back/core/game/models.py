from django.db import models
from pong_auth.models import CustomUser
from channels.db import database_sync_to_async
from django.core.serializers import serialize
from pong_auth.models import CustomUser
from django.db.models import Q

import logging
logger = logging.getLogger(__name__)

class Game(models.Model):
    player_1 = models.ForeignKey(CustomUser, related_name='player_1', on_delete=models.CASCADE)
    player_2 = models.ForeignKey(CustomUser, related_name='player_2', on_delete=models.CASCADE)
    winner   = models.ForeignKey(CustomUser, related_name='winner', on_delete=models.CASCADE, blank=True, null=True)
    score_player_1 = models.IntegerField(default=0)
    score_player_2 = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    game_type = models.TextField(blank=True, null=True)
    
    @classmethod
    @database_sync_to_async
    def store_match(cls, user1, user2, winner, scores, game_type):
        new_game = cls(player_1=user1, player_2=user2, winner=winner, score_player_1=scores[0], score_player_2=scores[1], game_type=game_type)
        new_game.save()

    @classmethod
    def get_games_for_user(cls, user_id):
        games_data = []
        games = cls.objects.filter(Q(player_1=user_id) | Q(player_2=user_id))
        for game in games:
            opponent = game.player_2 if game.player_1_id == user_id else game.player_1
            player = game.player_1 if game.player_1_id == user_id else game.player_2
            games_data.append({
                'username': player.username,
                'opponent_username': opponent.username,
                'player_score': game.score_player_1 if game.player_1_id == user_id else game.score_player_2,
                'opponent_score': game.score_player_2 if game.player_1_id == user_id else game.score_player_1,
                'date': game.created_at,
                'game_type': game.game_type
            })
        return games_data