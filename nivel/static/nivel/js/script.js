const volumeAgua = document.getElementById('volume-meter');
const volumeLabel = document.getElementById('volume-meter-label');
const statusVolume = document.getElementById('status-volume');
const mqttStatusTxt = document.getElementById('mqtt-status-txt');
const ledMqtt = document.getElementById('status-mqtt');
const mqttValor = document.getElementById('valor-mqtt');
const valorVazao = document.getElementById('valor-vazao');
const tempoAutonomia = document.getElementById('tempo-autonomia');
const ledBomba = document.getElementById('status-bomba');

const ctxVolume = document.getElementById('VolumeChart').getContext('2d');
const ctxVazao = document.getElementById('VazaoChart').getContext('2d');
const ctxStatusBomba = document.getElementById('statusBomba').getContext('2d');
const ctxTempoOnOff = document.getElementById('tempoOnOff').getContext('2d');

const labelsVolume = [];
const dadosVolume = [];
const labelsVazao = [];
const dadosVazao = [];

const dadosBomba = [];
const temposOnOff = [];

const cor = ['#e6f7ff', '#F0FAFF', '#eff5fa', '#63E4F2', '#2ECEF2', '#263173'];

// Cria o gráfico inicialmente vazio
// Volume
const chartVolume = new Chart(ctxVolume, {
  type: 'line',
  data: {
    labels: labelsVolume,
    datasets: [{
      label: 'Volume',
      data: dadosVolume,
      backgroundColor: cor[3],
      borderColor: cor[4],
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

// Vazão
const chartVazao = new Chart(ctxVazao, {
  type: 'bar',
  data: {
    labels: labelsVazao,
    datasets: [{
      label: 'Vazão',
      data: dadosVazao,
      backgroundColor: cor[3],
      borderColor: cor[4],
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

// Status bomba
const chartStatusBomba = new Chart(ctxStatusBomba, {
  type: 'line',
  data: {
    datasets: [{
      label: 'Estado da Bomba',
      data: dadosBomba,
      backgroundColor: cor[3],
      borderColor: cor[4],
      borderWidth: 2,
      fill: true,
      stepped: true // Para gráfico on/off
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: true,
    scales: {
      y: {
        min: -0.1,
        max: 1.1,
        ticks: {
          callback: function (value) {
            if (value === 1) return 'Ligada';
            if (value === 0) return 'Desligada';
          }
        },
        title: {
          display: true,
          text: 'Estado'
        }
      },
      x: {
        type: 'time',
        time: {
          unit: 'hour',
          tooltipFormat: "dd/MM/yyyy HH:mm:ss",
          displayFormats: {
            hour: "dd/MM/yyyy HH:mm"
          }
        },
        title: {
          display: true,
          text: 'Tempo'
        }
      }
    }
  }
});

// Status bomba
const chartOnOff = new Chart(ctxTempoOnOff, {
  type: 'pie',
  data: {
    labels: [
      'Bomba Ligada',
      'Bomba Desligada'
    ],
    datasets: [{
      label: 'Tempo em minutos',
      data: temposOnOff,
      backgroundColor: [
        cor[4],
        cor[5]
      ],
      hoverOffset: 4
    }]
  }
});

// Carrega dados do JSON local
async function carregarHistoricoVolume() {
  await carregarHistoricoVazao();
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
    let ultimoVolume = parseInt(feeds[feeds.length - 1].field1);
    atualizaTanque(ultimoVolume);

    mqttStatusTxt.textContent = 'Dados históricos carregados';
    mqttValor.textContent = 'Conectando...';

  } catch (err) {
    mqttStatusTxt.textContent = 'Erro ao carregar o arquivo volume.json';
    console.error(err);
  }
}

async function carregarHistoricoVazao() {
  await carregarHistoricoBomba();
  try {
    const response = await fetch('vazao.json');
    const json = await response.json();
    const feeds = json.feeds;

    feeds.forEach(feed => {
      const vazao = parseInt(feed.field1);
      const data = new Date(feed.created_at);
      const hora = data.toLocaleString('pt-BR');

      if (!isNaN(vazao)) {
        labelsVazao.push(hora);
        dadosVazao.push(vazao);
      }
    });

    chartVazao.update();

    // Atualiza tanque com o último valor do histórico
    let ultimaVazao = parseInt(feeds[feeds.length - 1].field1);
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
    if (feeds.length == 0) { //Se não tiver dados
      feeds.push({created_at: new Date(), field1: 'off'});
      throw new Error('Dados indisponíveis')
    }
    // Vai plotar um ponto virtual representando o momento de carregamento da página
    let statusAux = feeds[feeds.length - 1].field1;
    let tempoAux = new Date();
    feeds.push({created_at: tempoAux, field1: statusAux});
    let temposOn = [];
    let temposOff = [];
    let somaTemposOn = 0;
    let somaTemposOff = 0;

    feeds.forEach(feed => {
      const status = String(feed.field1);
      const data = new Date(feed.created_at);

      if (status === "on" || status === "off") {
        dadosBomba.push({
          x: data,
          y: status === 'on' ? 1 : 0
        });
      }
    });

    for (let i = 1; i < feeds.length; i++) {
      const anterior = feeds[i - 1];
      let aux = feeds[i];
      if (i == feeds.length - 1) { // último ítem 
      // ponto virtual invertido para calculo dos tempos on/off
        aux.field1 = feeds[i].field1 == 'on' ? 'off' : 'on';
      }
      const atual = aux;

      const tAnterior = new Date(anterior.created_at);
      const tAtual = new Date(atual.created_at);
      const diff = (tAtual - tAnterior) / 1000 / 60; // minutos

      // Considera somente transições de estado
      if (anterior.field1 === "on" && atual.field1 === "off") {
        temposOn.push(diff);      // tempo ligada
      } else if (anterior.field1 === "off" && atual.field1 === "on") {
        temposOff.push(diff);     // tempo desligada
      } else if (anterior.field1 === atual.field1 && i < feeds.length - 1) {  // se não teve transição usa o tempo do dado anterior na próxima iteração
        feeds[i].created_at = feeds[i - 1].created_at;
      }
    }

    // somatórios usando for
    for (let i = 0; i < temposOn.length; i++) {
      somaTemposOn += temposOn[i];
    }
    temposOnOff.push(Math.round(somaTemposOn));

    for (let i = 0; i < temposOff.length; i++) {
      somaTemposOff += temposOff[i];
    }
    temposOnOff.push(Math.round(somaTemposOff));

    chartStatusBomba.update();
    chartOnOff.update();

    //Descarta o ponto virtual para atualizar o card
    feeds.pop();
    // Atualiza tanque com o último valor do histórico
    let ultimoStatus = feeds[feeds.length - 1].field1 == 'on' ? 1 : 0;
    let ultimaHora = new Date(feeds[feeds.length - 1].created_at).toLocaleString('pt-BR');
    atualizaCardBomba(ultimoStatus, ultimaHora);

  } catch (err) {
    mqttStatusTxt.textContent = 'Erro ao carregar o arquivo bomba.json';
    console.error(err);
  }
}

// Conecta ao broker MQTT
async function conectarMQTT() {
  await carregarHistoricoVolume();
  const broker = 'wss://test.mosquitto.org:8081';
  const topicoVolume = 'pi/reservatorio/volume';
  const topicoVazao = 'pi/reservatorio/vazao';
  const topicoBomba = 'pi/reservatorio/bomba';

  const client = mqtt.connect(broker);

  client.on('connect', () => {
    mqttValor.textContent = 'Conectado';
    mqttStatusTxt.textContent = `Inscrito nos tópicos de volume, vazão e status da bomba`;
    ledMqtt.classList.remove('alert');
    ledMqtt.classList.add('on');

    // Inscreve nos dois tópicos
    client.subscribe([topicoVolume, topicoVazao, topicoBomba]);
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
        /*if (labelsVolume.length > 50) {
          labelsVolume.shift();
          dadosVolume.shift();
        }*/

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
        /*if (labelsVazao.length > 50) {
          labelsVazao.shift();
          dadosVazao.shift();
        }*/

        chartVazao.update();
      }
    } else if (topic === topicoBomba) {
      const estado = payload;
      if (estado === 'on_OK' || estado === 'off_OK') {
        // Adiciona ponto aos dados que irão para o gráfico
        const agora = new Date();
        const hora = agora.toLocaleString('pt-BR');
        const dadoAtual = estado === 'on_OK' ? 1 : 0;

        dadosBomba.push({ x: agora, y: dadoAtual });

        atualizaCardBomba(dadoAtual, hora);

        // Mantém os últimos 50 pontos
        /*if (dadosBomba.length > 50) {
          dadosBomba.shift();
        }*/

        // Atualiza dados para grafico pizza
        const anterior = dadosBomba[dadosBomba.length - 2];
        const atual = dadosBomba[dadosBomba.length - 1];

        const tAnterior = new Date(anterior.x);
        const tAtual = new Date(atual.x);
        const diff = (tAtual - tAnterior) / 1000 / 60; // minutos

        // Considera somente transições de estado
        if (anterior.y === 1 && atual.y === 0) {
          temposOnOff[0] += Math.round(diff);      // tempo ligada
        } else if (anterior.y === 0 && atual.y === 1) {
          temposOnOff[1] += Math.round(diff);     // tempo desligada
        }

        chartStatusBomba.update();
        chartOnOff.update();
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
    let ultimoDado = 1;

    if (typeof dadosBomba[0] !== "undefined") { //se tem dados salvos
      ultimoDado = dadosBomba[dadosBomba.length - 1].y;
    } else {
      dadosBomba.push({x: new Date, y: 0})
    }
    
    const comando = ultimoDado === 1 ? 'off' : 'on';

    client.publish(topicoBomba, comando, (err) => {
      if (err) {
        console.error('Erro ao publicar:', err);
      }
    });
  });
}

function atualizaTanque(ultimoVolume) {
  let ultimaVazao = dadosVazao[dadosVazao.length - 1];
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
  atualizaAutonomia(ultimoVolume, ultimaVazao);
}

function atualizaCardVazao(ultimaVazao) {
  let ultimoVolume = dadosVolume[dadosVolume.length - 1];
  valorVazao.textContent = `${ultimaVazao}`;
  atualizaAutonomia(ultimoVolume, ultimaVazao);
}

function atualizaAutonomia(volume, vazao) {
  if (vazao > 0) {
    let autonomia = parseInt(volume / vazao);
    tempoAutonomia.textContent = `${autonomia}`;
  } else {
    tempoAutonomia.textContent = '-'
  }
}

function atualizaCardBomba(status, hora) {
  let texto = status === 1 ? 'Ligada' : 'Desligada';
  document.getElementById('valor-bomba').textContent = texto;
  document.getElementById('hora-bomba').textContent = `${texto} ${hora}`;
  ledBomba.className = 'status';
  ledBomba.classList.add(status === 1 ? 'on' : 'off');
}

conectarMQTT();
