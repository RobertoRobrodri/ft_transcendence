from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class CustomUser(AbstractUser):
	score = models.IntegerField(default=0)
#	profile_picture = models.ImageField(upload_to='profile_pictures', null=True, blank=True)


""" porblemas al hacer MIGRATE. no es capaz de conectarse a la base de datos, sigue fallando el contenedor"""
""" ---------------------------------------------- """
class Player(models.Model):
    name = models.CharField(max_length=100)
    wins=models.PositiveIntegerField(default=0)
    losses=models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.name