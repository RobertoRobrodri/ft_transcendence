from rest_framework import generics
from rest_framework.response import Response
from .models import Game
from django.http import JsonResponse

import logging
logger = logging.getLogger(__name__)

class GamesViewset(generics.GenericAPIView):

    def get(self, request, user_id = None):
        try:
            if user_id is None:
                user_id = request.user.id
            games = Game.get_games_for_user(user_id)
            # serializer = self.get_serializer(games, many=True)
            return JsonResponse({'matches': games})
        except Exception as e:
            return JsonResponse({}, status=204)
        