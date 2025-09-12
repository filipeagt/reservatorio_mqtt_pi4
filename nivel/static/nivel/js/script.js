const volumeAgua = document.getElementById('volume-meter');
const volumeLabel = document.getElementById('volume-meter-label');
const statusVolume = document.getElementById('status-volume');
const mqttStatusTxt = document.getElementById('mqtt-status-txt');
const ledMqtt = document.getElementById('status-mqtt');
const mqttValor = document.getElementById('valor-mqtt');
const valorVazao = document.getElementById('valor-vazao');
const tempoAutonomia = document.getElementById('tempo-autonomia');
const ledBomba = document.getElementById('status-bomba');
let bombaLigada = false;

const ctxVolume = document.getElementById('waterVolumeChart').getContext('2d');
const ctxVazao = document.getElementById('waterVazaoChart').getContext('2d');

const labelsVolume = [];
const dadosVolume = [];
const labelsVazao = [];
const dadosVazao = [];
const labelsBomba = [];
const dadosBomba = [];

// Cria o gráfico inicialmente vazio
const chartVolume = new Chart(ctxVolume, {
  type: 'line',
  data: {
    labels: labelsVolume,
    datasets: [{
      label: 'Volume',
      data: dadosVolume,
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
          text: 'L'
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

const chartVazao = new Chart(ctxVazao, {
  type: 'bar',
  data: {
    labels: labelsVazao,
    datasets: [{
      label: 'Vazão',
      data: dadosVazao,
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
        max: 1800,
        title: {
          display: true,
          text: 'L/h'
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
async function carregarHistoricoVolume() {
  try {
    const response = await fetch('volume.json');
    const json = await response.json();
    const feeds = json.feeds;

    feeds.forEach(feed => {
      const volume = parseFloat(feed.field1);
      const data = new Date(feed.created_at);
      const hora = data.toLocaleString('pt-BR');

      if (!isNaN(volume)) {
        labelsVolume.push(hora);
        dadosVolume.push(volume);
      }
    });

    chartVolume.update();

    // Atualiza tanque com o último valor do histórico
    let ultimoVolume = parseInt(dadosVolume[dadosVolume.length - 1]);
    atualizaTanque(ultimoVolume);

    mqttStatusTxt.textContent = 'Dados históricos carregados';
    mqttValor.textContent = 'Conectando...';
    conectarMQTT();

  } catch (err) {
    mqttStatusTxt.textContent = 'Erro ao carregar o arquivo volume.json';
    console.error(err);
  }
}

async function carregarHistoricoVazao() {
  try {
    const response = await fetch('vazao.json');
    const json = await response.json();
    const feeds = json.feeds;

    feeds.forEach(feed => {
      const vazao = parseFloat(feed.field1);
      const data = new Date(feed.created_at);
      const hora = data.toLocaleString('pt-BR');

      if (!isNaN(vazao)) {
        labelsVazao.push(hora);
        dadosVazao.push(vazao);
      }
    });

    chartVazao.update();

    // Atualiza tanque com o último valor do histórico
    let ultimaVazao = parseInt(dadosVazao[dadosVazao.length - 1]);
    atualizaCardVazao(ultimaVazao);

  } catch (err) {
    mqttStatusTxt.textContent = 'Erro ao carregar o arquivo vazao.json';
    console.error(err);
  }
}

async function carregarHistoricoBomba() {
  try {
    const response = await fetch('bomba.json');
    const json = await response.json();
    const feeds = json.feeds;

    feeds.forEach(feed => {
      const status = toString(feed.field1);
      const data = new Date(feed.created_at);
      const hora = data.toLocaleString('pt-BR');

      if (status === "on" || status === "off") {
        labelsBomba.push(hora);
        dadosBomba.push(status === "on" ? 1 : 0);
      }
    });

    //chartBomba.update();

    // Atualiza tanque com o último valor do histórico
    let ultimoStatus = parseInt(dadosBomba[dadosBomba.length - 1]);
    atualizaCardBomba(ultimoStatus);

  } catch (err) {
    mqttStatusTxt.textContent = 'Erro ao carregar o arquivo vazao.json';
    console.error(err);
  }
}

// Conecta ao broker MQTT
function conectarMQTT() {
  const broker = 'wss://test.mosquitto.org:8081';
  const topicoVolume = 'pi/reservatorio/volume';
  const topicoVazao = 'pi/reservatorio/vazao';
  const topicoBomba = 'pi/reservatorio/bomba';

  const client = mqtt.connect(broker);

  client.on('connect', () => {
    mqttValor.textContent = 'Conectado';
    mqttStatusTxt.textContent = `Inscrito nos tópicos "${topicoVolume}" e "${topicoVazao}"`;
    ledMqtt.classList.remove('alert');
    ledMqtt.classList.add('on');

    // Inscreve nos dois tópicos
    client.subscribe([topicoVolume, topicoVazao]);
  });

  client.on('message', (topic, message) => {
    const payload = message.toString();

    if (topic === topicoVolume) {
      const volume = parseInt(payload);
      if (!isNaN(volume) && volume >= 0 && volume <= 1000) {
        // Atualiza tanque
        atualizaTanque(volume);

        // Adiciona ponto ao gráfico
        const agora = new Date();
        const hora = agora.toLocaleString('pt-BR');

        labelsVolume.push(hora);
        dadosVolume.push(volume);

        // Mantém os últimos 50 pontos
        if (labelsVolume.length > 50) {
          labelsVolume.shift();
          dadosVolume.shift();
        }

        chartVolume.update();
      }

    } else if (topic === topicoVazao) {
      const vazao = parseInt(payload);
      if (!isNaN(vazao) && vazao >= 0 && vazao <= 1800) {
        // Atualiza card
        atualizaCardVazao(vazao);

        // Adiciona ponto ao gráfico
        const agora = new Date();
        const hora = agora.toLocaleString('pt-BR');

        labelsVazao.push(hora);
        dadosVazao.push(vazao);

        // Mantém os últimos 50 pontos
        if (labelsVazao.length > 50) {
          labelsVazao.shift();
          dadosVazao.shift();
        }

        chartVazao.update();
      }
    }
  });

  client.on('error', err => {
    mqttValor.textContent = 'Erro';
    mqttStatusTxt.textContent = 'Não foi possível conectar ao broker';
    ledMqtt.classList.remove('alert');
    ledMqtt.classList.add('off');
    console.error('Erro MQTT:', err);
  });

  document.getElementById('power-bomba').addEventListener('click', () => {
    bombaLigada = !bombaLigada;
    const comando = bombaLigada ? 'on' : 'off';

    client.publish(topicoBomba, comando, (err) => {
      if (err) {
        console.error('Erro ao publicar:', err);
      } else {
        atualizaCardBomba();
      }
    });
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

function atualizaCardVazao(ultimaVazao) {
  valorVazao.textContent = `${ultimaVazao}`;
  let autonomia = parseInt(parseInt(dadosVolume[dadosVolume.length - 1]) / ultimaVazao);
  tempoAutonomia.textContent = `${autonomia}`;
}

function atualizaCardBomba(ultimoStatus) {
  let hora = new Date().toLocaleTimeString();
  let texto = ultimoStatus === 1 || 'on' ? 'Ligada' : 'Desligada'; //erro aqui
  document.getElementById('valor-bomba').textContent = texto;
  document.getElementById('hora-bomba').textContent = `${texto} às ${hora}`;
  ledBomba.className = 'status';
  ledBomba.classList.add(bombaLigada ? 'on' : 'off');
}

carregarHistoricoVolume();
carregarHistoricoVazao();
carregarHistoricoBomba();