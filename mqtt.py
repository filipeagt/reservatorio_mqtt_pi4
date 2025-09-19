import django
import os
import paho.mqtt.client as mqtt

# Configuração do Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "reservatorio_mqtt.settings")
django.setup()

from nivel.models import NivelReservatorio, VazaoReservatorio, BombaReservatorio

# Configuração do MQTT
MQTT_BROKER = "test.mosquitto.org"
MQTT_PORT = 1883
TOPIC_VOLUME = "pi/reservatorio/volume"
TOPIC_VAZAO = "pi/reservatorio/vazao"
TOPIC_BOMBA = "pi/reservatorio/bomba"

def on_connect(client, userdata, flags, rc):
    print(f"Conectado ao MQTT com código {rc}")
    client.subscribe(TOPIC_VOLUME)
    client.subscribe(TOPIC_VAZAO)
    client.subscribe(TOPIC_BOMBA)
    print(f"Inscrito nos tópicos: {TOPIC_VOLUME}, {TOPIC_VAZAO} e {TOPIC_BOMBA}")

def on_message(client, userdata, msg):
    try:
        payload = msg.payload.decode()
        topic = msg.topic

        if topic == TOPIC_VOLUME:
            volume = int(payload)
            if 0 <= volume <= 1000:
                NivelReservatorio.objects.create(nivel=volume)
                print(f"[MQTT] Volume recebido e salvo: {volume}")
            else:
                print("Volume fora do intervalo 0–1000")

        elif topic == TOPIC_VAZAO:
            vazao = int(payload)  
            if 0 <= vazao <= 1800:
                VazaoReservatorio.objects.create(vazao=vazao)
                print(f"[MQTT] Vazão recebida e salva: {vazao}")
            else:
                print("Vazão fora do intervalo 0–1800")
        elif topic == TOPIC_BOMBA:
            status = str(payload)  
            if status in ("on_OK", "off_OK"):
                BombaReservatorio.objects.create(status=status[:-3]) # Remove o '_OK'
                print(f"[MQTT] Status recebido e salvo: {status}")
            elif status in ("on", "off"):
                print(f"Comando '{status}' enviado, aguardando resposta.")
            elif status == "!on":
                print("A bomba não foi ligada pois o nível máximo foi atingido.")
            elif status == "!off":
                print("A bomba não pode ser desligada pois o nível está abaixo do mínimo.")
            else:
                print("Status inválido!")

    except Exception as e:
        print(f"Erro ao processar mensagem MQTT: {e}")

def start_mqtt():
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message

    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    print("Iniciando loop MQTT...")
    client.loop_forever()

if __name__ == "__main__":
    start_mqtt()
