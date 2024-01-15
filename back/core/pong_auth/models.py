from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.

class CustomUser(AbstractUser):
	class Status(models.TextChoices):
		OFFLINE = "offline"
		ONLINE = "online"
		INGAME = "ingame"
		INQUEU = "inqueu"

	score = models.IntegerField(default=0)
	status = models.CharField(choices=Status, default=Status.OFFLINE)
	profile_picture = models.ImageField(upload_to='media/', null=True, blank=True)
	friends = models.ManyToManyField('self', blank=True)
