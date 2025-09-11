from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('volume.json', views.volume_json, name='volume_json'),
    path('vazao.json', views.vazao_json, name='vazao_json'),
]
