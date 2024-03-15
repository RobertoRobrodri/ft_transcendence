from django.db import models
from pong_auth.models import CustomUser
from channels.db import database_sync_to_async
from django.core.serializers import serialize

class Game(models.Model):
    player_1 = models.ForeignKey(CustomUser, related_name='player_1', on_delete=models.CASCADE)
    player_2 = models.ForeignKey(CustomUser, related_name='player_2', on_delete=models.CASCADE, blank=True, null=True)
    winner   = models.ForeignKey(CustomUser, related_name='winner', on_delete=models.CASCADE, blank=True, null=True)
    score_player_1 = models.IntegerField(default=0)
    score_player_2 = models.IntegerField(default=0)
    
    @classmethod
    @database_sync_to_async
    def store_match(cls, user1, user2, winner, scores):
        new_message = cls(player_1=user1, player_2=user2, winner=winner, score_player_1=scores[0], score_player_2=scores[1])
        new_message.save()