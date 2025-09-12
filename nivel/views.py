from django.shortcuts import render
from django.http import JsonResponse
from .models import NivelReservatorio, VazaoReservatorio, BombaReservatorio

def index(request):
    return render(request, 'nivel/index.html')

def volume_json(request):
    dados = NivelReservatorio.objects.order_by('timestamp')
    json_data = {
        "feeds": [
            {
                "created_at": d.timestamp.isoformat(),
                "field1": str(d.nivel)
            }
            for d in dados
        ]
    }
    return JsonResponse(json_data)

def vazao_json(request):
    dados = VazaoReservatorio.objects.order_by('timestamp')
    json_data = {
        "feeds": [
            {
                "created_at": d.timestamp.isoformat(),
                "field1": str(d.vazao)
            }
            for d in dados
        ]
    }
    return JsonResponse(json_data)

def bomba_json(request):
    dados = BombaReservatorio.objects.order_by('timestamp')
    json_data = {
        "feeds": [
            {
                "created_at": d.timestamp.isoformat(),
                "field1": str(d.status)
            }
            for d in dados
        ]
    }
    return JsonResponse(json_data)
