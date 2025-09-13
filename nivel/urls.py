from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('volume.json', views.volume_json, name='volume_json'),
    path('vazao.json', views.vazao_json, name='vazao_json'),
    path('bomba.json', views.bomba_json, name='bomba_json'),
]
