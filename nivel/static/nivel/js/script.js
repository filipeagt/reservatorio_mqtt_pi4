const nivelAgua = document.getElementById('nivelAgua');
    const nivelLabel = document.getElementById('nivelLabel');
    const status = document.getElementById('status');
    const ctx = document.getElementById('waterLevelChart').getContext('2d');

    const labels = [];
    const dados = [];

    // Cria o gráfico inicialmente vazio
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Nível (%)',
          data: dados,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 2
        }]
      },
      options: {
        responsive: true,
        animation: false,
        scales: {
          y: {
            min: 0,
            max: 100,
            title: {
              display: true,
              text: 'Nível (%)'
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
        const response = await fetch('/historico.json');
        const json = await response.json();
        const feeds = json.feeds;

        feeds.forEach(feed => {
          const nivel = parseFloat(feed.field1);
          const data = new Date(feed.created_at);
          const hora = data.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });

          if (!isNaN(nivel)) {
            labels.push(hora);
            dados.push(nivel);
          }
        });

        chart.update();

        // Atualiza tanque com o último valor do histórico
        const ultimoNivel = dados[dados.length - 1];
        nivelAgua.style.height = `${ultimoNivel}%`;
        nivelLabel.textContent = `Nível: ${ultimoNivel.toFixed(1)}%`;

        status.textContent = 'Dados históricos carregados. Conectando ao MQTT...';
        conectarMQTT();

      } catch (err) {
        status.textContent = 'Erro ao carregar o arquivo JSON';
        console.error(err);
      }
    }

    // Conecta ao broker MQTT
    function conectarMQTT() {
      const broker = 'wss://test.mosquitto.org:8081';
      const topico = 'pi/reservatorio/nivel';

      const client = mqtt.connect(broker);

      client.on('connect', () => {
        status.textContent = `Conectado ao MQTT e inscrito no tópico "${topico}"`;
        client.subscribe(topico);
      });

      client.on('message', (topic, message) => {
        if (topic === topico) {
          const nivel = parseFloat(message.toString());
          if (!isNaN(nivel) && nivel >= 0 && nivel <= 100) {
            // Atualiza tanque
            nivelAgua.style.height = `${nivel}%`;
            nivelLabel.textContent = `Nível: ${nivel.toFixed(1)}%`;

            // Adiciona ponto ao gráfico
            const agora = new Date();
            const hora = agora.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });

            labels.push(hora);
            dados.push(nivel);

            // Mantém os últimos 50 pontos
            if (labels.length > 50) {
              labels.shift();
              dados.shift();
            }

            chart.update();
          }
        }
      });

      client.on('error', err => {
        status.textContent = 'Erro de conexão MQTT';
        console.error('Erro MQTT:', err);
      });
    }

    carregarHistorico();