from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('historico.json', views.historico_json, name='historico_json'),
]
