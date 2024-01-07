from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class CustomUser(AbstractUser):
	score = models.IntegerField(default=0)
#	profile_picture = models.ImageField(upload_to='profile_pictures', null=True, blank=True)
