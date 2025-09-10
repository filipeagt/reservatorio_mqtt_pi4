import django
import os
import paho.mqtt.client as mqtt

# Configuração do Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "reservatorio_mqtt.settings")
django.setup()

from nivel.models import NivelReservatorio

# Configuração do MQTT
MQTT_BROKER = "test.mosquitto.org"
MQTT_PORT = 1883
MQTT_TOPIC = "pi/reservatorio/volume"

def on_connect(client, userdata, flags, rc):
    print(f"Conectado ao MQTT com código {rc}")
    client.subscribe(MQTT_TOPIC)

def on_message(client, userdata, msg):
    try:
        payload = msg.payload.decode()
        nivel = int(payload)
        if 0 <= nivel <= 1000:
            NivelReservatorio.objects.create(nivel=nivel)
            print(f"[MQTT] Nível recebido e salvo: {nivel}")
        else:
            print("Valor fora do intervalo 0–1000")

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
