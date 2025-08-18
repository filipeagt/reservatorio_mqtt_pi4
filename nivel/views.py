from django.shortcuts import render
from django.http import JsonResponse
from .models import NivelReservatorio

def index(request):
    return render(request, 'nivel/index.html')

def historico_json(request):
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
