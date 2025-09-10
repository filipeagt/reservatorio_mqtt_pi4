const volumeAgua = document.getElementById('volume-meter');
const volumeLabel = document.getElementById('volume-meter-label');
const statusVolume = document.getElementById('status-volume');
const mqttStatusTxt = document.getElementById('mqtt-status-txt');
const ledMqtt = document.getElementById('status-mqtt');
const mqttValor = document.getElementById('valor-mqtt');
const ctxVolume = document.getElementById('waterVolumeChart').getContext('2d');

const labels = [];
const dados = [];

// Cria o gráfico inicialmente vazio
const chartVolume = new Chart(ctxVolume, {
  type: 'line',
  data: {
    labels: labels,
    datasets: [{
      label: 'Volume (L)',
      data: dados,
      backgroundColor: '#63E4F2',
      borderColor: '#2ECEF2',
      borderWidth: 2,
      fill: true,
      tension: 0.3,
      pointRadius: 2
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: true,
    scales: {
      y: {
        min: 0,
        max: 1000,
        title: {
          display: true,
          text: 'Volume (L)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Horário'
        }
      }
    }
  }
});

// Carrega dados do JSON local
async function carregarHistorico() {
  try {
    const response = await fetch('historico.json');
    const json = await response.json();
    const feeds = json.feeds;

    feeds.forEach(feed => {
      const volume = parseFloat(feed.field1);
      const data = new Date(feed.created_at);
      const hora = data.toLocaleString('pt-BR');

      if (!isNaN(volume)) {
        labels.push(hora);
        dados.push(volume);
      }
    });

    chartVolume.update();

    // Atualiza tanque com o último valor do histórico
    const ultimoVolume = parseInt(dados[dados.length - 1]);
    atualizaTanque(ultimoVolume);

    mqttStatusTxt.textContent = 'Dados históricos carregados';
    mqttValor.textContent = 'Conectando...';
    conectarMQTT();

  } catch (err) {
    mqttStatusTxt.textContent = 'Erro ao carregar o arquivo JSON';
    console.error(err);
  }
}

// Conecta ao broker MQTT
function conectarMQTT() {
  const broker = 'wss://test.mosquitto.org:8081';
  const topico = 'pi/reservatorio/volume';

  const client = mqtt.connect(broker);

  client.on('connect', () => {
    mqttValor.textContent = 'Conectado';
    mqttStatusTxt.textContent = `Inscrito no tópico "${topico}"`;
    ledMqtt.classList.remove('alert');
    ledMqtt.classList.add('on');
    client.subscribe(topico);
  });

  client.on('message', (topic, message) => {
    if (topic === topico) {
      const volume = parseInt(message.toString());
      if (!isNaN(volume) && volume >= 0 && volume <= 1000) {
        // Atualiza tanque
        atualizaTanque(volume);

        // Adiciona ponto ao gráfico
        const agora = new Date();
        const hora = agora.toLocaleString('pt-BR');

        labels.push(hora);
        dados.push(volume);

        // Mantém os últimos 50 pontos
        if (labels.length > 50) {
          labels.shift();
          dados.shift();
        }

        chartVolume.update();
      }
    }
  });

  client.on('error', err => {
    mqttValor.textContent = 'Erro'
    mqttStatusTxt.textContent = 'Não foi possível conectar ao broker';
    ledMqtt.classList.remove('alert');
    ledMqtt.classList.add('off');
    console.error('Erro MQTT:', err);
  });
}

function atualizaTanque(ultimoVolume) {
  volumeAgua.value = `${ultimoVolume}`;
  volumeLabel.textContent = `${ultimoVolume}`;
  statusVolume.className = 'mdi mdi-water-alert status';
  if (ultimoVolume < 250) {
    statusVolume.textContent = 'Baixo';
    statusVolume.classList.add('off');
    alert('Nível baixo!');
  } else if (ultimoVolume <= 950) {
    statusVolume.textContent = 'Normal';
  } else if (ultimoVolume > 950) {
    statusVolume.textContent = 'Alto';
    statusVolume.classList.add('alert');
    alert('Risco de transbordamento!');
  }
}

carregarHistorico();