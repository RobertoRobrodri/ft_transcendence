from rest_framework import generics, status
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from pong_auth.models import CustomUser
from .models import Game
from .serializers import GameSerializer
from django.db.models import Q

class GamesViewset(viewsets.GenericViewSet):
    queryset = Game.objects.all()
    serializer_class =GameSerializer

    def create(self, request):
        user = request.user
        data = { 'player_1':user.id }
        game = self.serializer_class(data=data)
        if (game.is_valid()):
            game.save()
            return Response({"message": "Game created"}, status=status.HTTP_200_OK)
        return Response({"error": Game.errors}, status=status.HTTP_400_BAD_REQUEST)
    
    #Join Game
    def partial_update(self, request, *args, **kwargs):
        user = request.user
        game_id = kwargs.get('pk')
        try:
            game = Game.objects.get(pk=game_id)
        except:
            return Response({"error": "Game does not exist."}, status=status.HTTP_400_BAD_REQUEST)
        # Check if user is already in the Game
        if (game.player_2.id == user.id):
            return Response({"error":"Already joined"}, status=status.HTTP_400_BAD_REQUEST)
        game.player_2 = user.id
        return Response({"message":"Joined Game"}, status=status.HTTP_200_OK)
    

    # @action(detail=True, methods=['patch'])
    # def leave_Game(self, request, *args, **kwargs):
    #     user = request.user
    #     game_id = kwargs.get('pk')
    #     try:
    #         game = Game.objects.get(pk=game_id)
    #     except:
    #         return Response({"error": "Game does not exist."}, status=status.HTTP_400_BAD_REQUEST)
    #     game.players.remove(user.id)
    #     # Check if Game is empty, in that case delete Game
    #     if (len(Game.players.all()) == 0):
    #         Game.delete()
    #     return Response({"message":"Left Game"}, status=status.HTTP_200_OK)
