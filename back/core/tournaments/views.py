from rest_framework import generics, status
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from pong_auth.models import CustomUser
from .models import Tournament
from .serializers import TournamentSerializer
from django.db.models import Q

class TournamentsViewset(viewsets.GenericViewSet):
    queryset = Tournament.objects.all()
    serializer_class =TournamentSerializer

    def create(self, request):
        user = request.user
        data = request.data
        data.update({ 'tournament_admin':user.id })
        tournament = self.serializer_class(data=data)
        if (tournament.is_valid()):
            tournament.save()
            return Response({"message": "Tournament created"}, status=status.HTTP_200_OK)
        return Response({"error": tournament.errors}, status=status.HTTP_400_BAD_REQUEST)
    
    #Join tournament
    def partial_update(self, request, *args, **kwargs):
        user = request.user
        tournament_id = kwargs.get('pk')
        try:
            tournament = Tournament.objects.get(pk=tournament_id)
        except:
            return Response({"error": "Tournament does not exist."}, status=status.HTTP_400_BAD_REQUEST)
        # Check if tournament is full
        if (len(tournament.players.all()) < tournament.size):
            # Check if user is already in the tournament
            if (tournament.players.filter(pk=user.id).exists()):
                return Response({"error":"Already joined"}, status=status.HTTP_400_BAD_REQUEST)
            tournament.players.add(user.id)
            return Response({"message":"Joined Tournament"}, status=status.HTTP_200_OK)
        return Response({"error":"Tournament is full"}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['patch'])
    def leave_tournament(self, request, *args, **kwargs):
        user = request.user
        tournament_id = kwargs.get('pk')
        try:
            tournament = Tournament.objects.get(pk=tournament_id)
        except:
            return Response({"error": "Tournament does not exist."}, status=status.HTTP_400_BAD_REQUEST)
        tournament.players.remove(user.id)
        #TODO pass tournament_admin to another player
        # Check if tournament is empty, in that case delete tournament
        if (len(tournament.players.all()) == 0):
            tournament.delete()
        return Response({"message":"Left Tournament"}, status=status.HTTP_200_OK)
