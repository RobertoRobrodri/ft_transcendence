from rest_framework import generics, status
from rest_framework import viewsets
from rest_framework.response import Response
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
