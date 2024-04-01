from django.db import models
from django.contrib.auth.models import AbstractUser
from channels.db import database_sync_to_async

# Create your models here.

class CustomUser(AbstractUser):
    class Status(models.TextChoices):
        INMENU = "inmenu"
        INGAME = "ingame"
        INQUEU = "inqueu"

    #? Can we make them unsigned?
    wins                = models.IntegerField(default=0)
    losses              = models.IntegerField(default=0)
    status              = models.CharField(max_length=9, choices=Status, default=Status.INMENU)
    connected           = models.BooleanField(default=False)
    channel_name        = models.CharField(max_length=255, blank=True, null=True)
    ignored_users       = models.ManyToManyField('self', blank=True, symmetrical=False, related_name='ignored')
    # Used for 42 Auth
    external_id         = models.IntegerField(null=True, blank=True)
    #TODO add default profile picture
    profile_picture     = models.ImageField(upload_to='../media/', null=True, blank=True)
    friends             = models.ManyToManyField('self', blank=True)
    # 2FA
    TwoFactorAuth       = models.BooleanField(default=False)
    #TODO Historial should be a table of tournaments
    #history
    
    @classmethod
    @database_sync_to_async
    def get_connected_usernames(cls):
        connected_users = cls.objects.filter(connected=True).values_list('username', flat=True)
        return list(connected_users)
    
    @classmethod
    @database_sync_to_async
    def get_connected_users_not_me(cls, user):
        connected_users = cls.objects.filter(connected=True).exclude(id=user.id).values('id', 'username')
        # connected_users = cls.objects.filter(connected=True).exclude(id=user.id).values_list('username', flat=True)
        return list(connected_users)
    
    # @classmethod
    # @database_sync_to_async
    # def get_user_by_username(cls, username):
    #     try:
    #         return cls.objects.get(username=username)
    #     except cls.DoesNotExist:
    #         return None
    
    @classmethod
    @database_sync_to_async
    def get_user_by_id(cls, id):
        try:
            return cls.objects.get(id=id)
        except cls.DoesNotExist:
            return None
        
    @classmethod
    @database_sync_to_async
    def update_user_on_connect(cls, user, channel_name):
        user.channel_name = channel_name
        user.connected = True
        user.save()

    @classmethod
    @database_sync_to_async
    def update_user_on_disconnect(cls, user):
        user.connected = True
        user.save()
    
    @classmethod
    @database_sync_to_async
    def ignore_user(cls, user, id):
        user_to_ignore = CustomUser.objects.get(id=id)
        user.ignored_users.add(user_to_ignore)
        user.save()

    @classmethod
    @database_sync_to_async
    def unignore_user(cls, user, user_id):
        user_to_unignore = CustomUser.objects.get(id=user_id)
        user.ignored_users.remove(user_to_unignore)
        user.save()

    @classmethod
    @database_sync_to_async
    def get_ignored_users(cls, user_id):
        user = CustomUser.objects.get(id=user_id)
        # ignored_users = user.ignored_users.values('id', 'username')
        ignored_users = user.ignored_users.values_list('id', flat=True)
        return list(ignored_users)
    
    @classmethod
    @database_sync_to_async
    def user_win(cls, user):
        user.wins += 1
        user.save()
    
    @classmethod
    @database_sync_to_async
    def user_lose(cls, user):
        user.losses += 1
        user.save()