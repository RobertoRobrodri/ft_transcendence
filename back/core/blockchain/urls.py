from django.urls import path
from . import views

urlpatterns = [
    path('getTournaments/<int:user_id>/', views.ContractGetListView.as_view(), name='get_tournaments'),
    path('getTournamentTable/', views.ContractGetTableView.as_view(), name='get_tournamentTable'),
]