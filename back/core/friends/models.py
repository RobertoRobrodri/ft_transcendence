from django.db import models
from pong_auth.models import CustomUser

class FriendRequest(models.Model):
	sender = models.ForeignKey(CustomUser, related_name='sender', on_delete=models.CASCADE)
	receiver = models.ForeignKey(CustomUser, related_name='receiver', on_delete=models.CASCADE)