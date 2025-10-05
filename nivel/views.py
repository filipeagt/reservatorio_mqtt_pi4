from django.shortcuts import render
from django.http import JsonResponse
from .models import NivelReservatorio, VazaoReservatorio, BombaReservatorio
from datetime import timedelta
from django.utils import timezone

def index(request):
    return render(request, 'nivel/index.html')

def volume_json(request):

    # Lê o parâmetro "dias" da URL (ex: ?dias=7)
    dias_param = request.GET.get('dias', 30)

    try:
        # Converte para inteiro, caso o usuário envie algo válido
        dias = int(dias_param)
    except ValueError:
        # Caso o parâmetro não seja número, usa 30 por padrão
        dias = 30

    # Calcula a data limite
    data_limite = timezone.now() - timedelta(days=dias)

    # Filtra apenas os registros dentro do período
    dados = NivelReservatorio.objects.filter(timestamp__gte=data_limite).order_by('timestamp')

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
    
    dias_param = request.GET.get('dias', 30)

    try:
        dias = int(dias_param)
    except ValueError:
        dias = 30

    data_limite = timezone.now() - timedelta(days=dias)

    dados = VazaoReservatorio.objects.filter(timestamp__gte=data_limite).order_by('timestamp')

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
    
    dias_param = request.GET.get('dias', 30)

    try:
        dias = int(dias_param)
    except ValueError:
        dias = 30

    data_limite = timezone.now() - timedelta(days=dias)

    dados = BombaReservatorio.objects.filter(timestamp__gte=data_limite).order_by('timestamp')

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
