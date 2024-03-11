from django.urls import path
from . import views

urlpatterns = [
    path('put/', views.ContractPutView.as_view(), name='contract_add'),
    path('get/', views.ContractGetView.as_view(), name='contract_get'),
]