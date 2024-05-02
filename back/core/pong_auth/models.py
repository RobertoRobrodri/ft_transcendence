from django.db import models
from django.contrib.auth.models import AbstractUser
from channels.db import database_sync_to_async
from game.elo import expected, elo
import base64

import logging
logger = logging.getLogger(__name__)

class CustomUser(AbstractUser):
    class Status(models.TextChoices):
        INMENU = "inmenu"
        INGAME = "ingame"
        INQUEU = "inqueu"
        OFFLINE = "offline"

    wins                        = models.IntegerField(default=0)
    losses                      = models.IntegerField(default=0)
    elo                         = models.IntegerField(default=1000)
    wins_pool                   = models.IntegerField(default=0)
    losses_pool                 = models.IntegerField(default=0)
    elo_pool                    = models.IntegerField(default=1000)
    status                      = models.CharField(max_length=9, choices=Status, default=Status.INMENU)
    connected                   = models.BooleanField(default=False)
    channel_name                = models.CharField(max_length=255, blank=True, null=True)
    notifications_channel_name  = models.CharField(max_length=255, blank=True, null=True)
    ignored_users               = models.ManyToManyField('self', blank=True, symmetrical=False, related_name='ignored')
    # Used for 42 Auth      
    external_id                 = models.IntegerField(null=True, blank=True)
    profile_picture             = models.ImageField(upload_to='', null=True, blank=True)
    friends                     = models.ManyToManyField('self', blank=True)
    # 2FA       
    TwoFactorAuth               = models.BooleanField(default=False)
    OTP_SECRET_KEY              = models.CharField(max_length = 200, blank=True, null=True)
    friend_requests             = models.ManyToManyField('self', symmetrical=False, related_name='friend_requests_received')
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
        connected_users = cls.objects.filter(connected=True).exclude(id=user.id)
        
        # Lista para almacenar los datos de los usuarios conectados
        users_data = []
        
        for connected_user in connected_users:
            # Obtiene la URL de la imagen del perfil si está disponible
            profile_picture_url = ''
            if connected_user.profile_picture:
                # Open the profile picture file, read its content, and encode it in base64
                with open(connected_user.profile_picture.path, "rb") as image_file:
                    profile_picture_content = base64.b64encode(image_file.read()).decode('utf-8')
                    profile_picture_url = f'data:image/jpeg;base64,{profile_picture_content}'
            
            # Agrega los datos del usuario a la lista
            users_data.append({
                'id': connected_user.id,
                'username': connected_user.username,
                'image': profile_picture_url,
            })
        
        return users_data
    
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
        u = CustomUser.objects.get(id=user.id)
        u.channel_name = channel_name
        u.connected = True
        u.save()

    @classmethod
    @database_sync_to_async
    def update_user_on_connect_to_site(cls, user, nt_channel_name):
        u = CustomUser.objects.get(id=user.id)
        u.status = CustomUser.Status.INMENU
        u.notifications_channel_name = nt_channel_name
        u.save()

    @classmethod
    @database_sync_to_async
    def update_user_on_disconnect(cls, user):
        u = CustomUser.objects.get(id=user.id)
        u.connected = False
        u.save()

    @classmethod
    @database_sync_to_async
    def update_user_on_disconnect_from_site(cls, user):
        u = CustomUser.objects.get(id=user.id)
        u.status = CustomUser.Status.OFFLINE
        u.save()
    
    @classmethod
    @database_sync_to_async
    def ignore_user(cls, user, id):
        user_to_ignore = CustomUser.objects.get(id=id)
        u = CustomUser.objects.get(id=user.id)
        u.ignored_users.add(user_to_ignore)
        u.save()

    @classmethod
    @database_sync_to_async
    def unignore_user(cls, user, user_id):
        user_to_unignore = CustomUser.objects.get(id=user_id)
        u = CustomUser.objects.get(id=user.id)
        u.ignored_users.remove(user_to_unignore)
        u.save()
        
    @classmethod
    @database_sync_to_async
    def get_ignored_users_data(cls, user_id):
        user = CustomUser.objects.get(id=user_id)
        ignored_users = user.ignored_users.all()
        
        # Lista para almacenar los datos de los usuarios ignorados
        users_data = []
        
        for ignored_user in ignored_users:
            # Obtiene la URL de la imagen del perfil si está disponible
            profile_picture_url = ''
            if ignored_user.profile_picture:
                with open(ignored_user.profile_picture.path, "rb") as image_file:
                    profile_picture_content = base64.b64encode(image_file.read()).decode('utf-8')
                    profile_picture_url = f'data:image/jpeg;base64,{profile_picture_content}'
            
            # Agrega los datos del usuario ignorado a la lista
            users_data.append({
                'id': ignored_user.id,
                'username': ignored_user.username,
                'image': profile_picture_url,
            })
        
        return users_data
    
    @classmethod
    @database_sync_to_async
    def get_ignored_users(cls, user_id):
        user = CustomUser.objects.get(id=user_id)
        # ignored_users = user.ignored_users.values('id', 'username')
        ignored_users = user.ignored_users.values_list('id', flat=True)
        return list(ignored_users)
    
    @classmethod
    @database_sync_to_async
    def user_win(cls, user, elo_player_1, elo_player_2, result):
        expected_result = expected(elo_player_1, elo_player_2)
        new_elo = elo(elo_player_1, result, expected_result)
        u = CustomUser.objects.get(id=user.id)
        u.wins += 1
        u.elo = new_elo
        u.save()
    
    @classmethod
    @database_sync_to_async
    def user_lose(cls, user, elo_player_1, elo_player_2, result):
        expected_result = expected(elo_player_1, elo_player_2)
        new_elo = elo(elo_player_1, result, expected_result)
        u = CustomUser.objects.get(id=user.id)
        u.losses += 1
        u.elo = new_elo
        u.save()
    
    @classmethod
    @database_sync_to_async
    def user_win_pool(cls, user, elo_player_1, elo_player_2, result):
        expected_result = expected(elo_player_1, elo_player_2)
        new_elo = elo(elo_player_1, result, expected_result)
        u = CustomUser.objects.get(id=user.id)
        u.wins_pool += 1
        u.elo_pool = new_elo
        u.save()
    
    @classmethod
    @database_sync_to_async
    def user_lose_pool(cls, user, elo_player_1, elo_player_2, result):
        expected_result = expected(elo_player_1, elo_player_2)
        new_elo = elo(elo_player_1, result, expected_result)
        u = CustomUser.objects.get(id=user.id)
        u.losses_pool += 1
        u.elo_pool = new_elo
        u.save()