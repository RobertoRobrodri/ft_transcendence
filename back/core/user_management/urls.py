# urls.py
# <slug:usernam>
from django.urls import path
from . import views

urlpatterns = [
    path('user_update/<int:pk>', views.UserUpdateView.as_view(), name='user-update'),
	path('user_delete/<int:pk>', views.UserDeleteView.as_view(), name='user-delete'),
	path('user_list/<int:pk>', views.UserListView.as_view(), name='user-list'),
	path('user_list_all/', views.UserListAllView.as_view(), name='user-list-all'),
]