from django.apps import AppConfig
from django.db.models.signals import post_migrate

def reset_db_fields(sender, **kwargs):
    from .models import CustomUser
    CustomUser.objects.update(connected=False)
    CustomUser.objects.update(status=CustomUser.Status.INMENU)
    CustomUser.objects.update(channel_name="")

class AuthConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'pong_auth'
    def ready(self):
        post_migrate.connect(reset_db_fields, sender=self)
