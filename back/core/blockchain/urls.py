from django.urls import path
from . import views

urlpatterns = [
    # path('put/', views.ContractPutView.as_view(), name='contract_add'),
    path('getTournaments/', views.ContractGetListView.as_view(), name='get_tournaments'),
    path('getTournamentTable/', views.ContractGetTableView.as_view(), name='get_tournamentTable'),
]