from django.db import models
from pong_auth.models import CustomUser
from asgiref.sync import sync_to_async

class Tournament(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    
    @classmethod
    @sync_to_async
    def delete_tournament(cls, tournament_id):
        try:
            tournament = cls.objects.get(id=tournament_id)
            tournament.delete()
            return True
        except cls.DoesNotExist:
            return False
        
    def __str__(self):
        return self.name

class Participant(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    tournaments = models.ManyToManyField(Tournament, through='Participation')

    def __str__(self):
        return str(self.user)

    @classmethod
    @sync_to_async
    def register_participants_in_tournament(cls, user_ids, tournament_id, tournament_name):
        tournament, created = Tournament.objects.get_or_create(id=tournament_id, defaults={'name': tournament_name})

        for user_id in user_ids:
            user = CustomUser.objects.get(id=user_id)
            obj_participant, created = cls.objects.get_or_create(user=user)
            obj_participant.tournaments.add(tournament)

    @classmethod
    def get_tournaments_by_participant(cls, user_id):
        user = CustomUser.objects.get(id=user_id)
        participant = cls.objects.get(user=user)
        participated_tournaments = participant.tournaments.all()
        return [{'id': tournament.id, 'name': tournament.name, 'created_at': tournament.created_at} for tournament in participated_tournaments]

class Participation(models.Model):
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE)
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.participant.user.username} in {self.tournament.name}"
