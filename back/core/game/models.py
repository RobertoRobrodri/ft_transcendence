from django.db import models
from pong_auth.models import CustomUser

class Game(models.Model):
    player_1 = models.ForeignKey(CustomUser, related_name='player_1', on_delete=models.CASCADE)
    player_2 = models.ForeignKey(CustomUser, related_name='player_2', on_delete=models.CASCADE, blank=True, null=True)
    winner   = models.ForeignKey(CustomUser, related_name='winner', on_delete=models.CASCADE, blank=True, null=True)
    score_player_1 = models.IntegerField(default=0)
    score_player_2 = models.IntegerField(default=0)