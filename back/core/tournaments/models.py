from django.db import models
from pong_auth.models import CustomUser

class Tournament(models.Model):
    size                = models.IntegerField(default=0)
    name                = models.CharField(max_length=42)
    tournament_admin    = models.ForeignKey(CustomUser, related_name='tournament_admin', on_delete=models.CASCADE, blank=True, null=True)
    winner              = models.ForeignKey(CustomUser, related_name='tournament_winner', on_delete=models.CASCADE, blank=True, null=True)
    players             = models.ManyToManyField(CustomUser, blank=True, related_name='tournament_players')