from django.urls import path
from . import views

urlpatterns = [
	path('getMatches/', views.GamesViewset.as_view(), name='get_matches'),
    path('getMatches/<int:user_id>/', views.GamesViewset.as_view(), name='get_matches'),
]