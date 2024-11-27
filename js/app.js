const ctx = document.getElementById("qamChart").getContext("2d");
const qamSelect = document.getElementById("qam-select");
const snrRange = document.getElementById("snr-range");
const snrValue = document.getElementById("snr-value");
const recommendedQamInput = document.getElementById("recommended-qam");

function generateQAMPoints(qamValue) {
  const points = [];
  if (qamValue === 8) {
    // Generar puntos para 8-QAM (4x4 grid)
    const side = Math.sqrt(qamValue + 8);
    const step = 2 / side;
    for (let i = 0; i < side; i++) {
      for (let j = 0; j < side; j++) {
        if (
          (i == 0 && j == 0) ||
          (i == 0 && j == 3) ||
          (i == 3 && j == 0) ||
          (i == 3 && j == 3) ||
          (i == 1 && j == 1) ||
          (i == 1 && j == 2) ||
          (i == 2 && j == 1) ||
          (i == 2 && j == 2)
        ) {
          points.push({
            x: -1 + step / 2 + i * step,
            y: -1 + step / 2 + j * step,
          });
        }
      }
    }
  } else if (qamValue === 32) {
    // Generar puntos para 32-QAM (6x6 grid sin las esquinas)
    const side = Math.sqrt(qamValue + 4);
    const step = 2 / side;
    for (let i = 0; i < side; i++) {
      for (let j = 0; j < side; j++) {
        if (
          !(i == 0 && j == 0) &&
          !(i == 5 && j == 0) &&
          !(i == 0 && j == 5) &&
          !(i == 5 && j == 5)
        ) {
          points.push({
            x: -1 + step / 2 + i * step,
            y: -1 + step / 2 + j * step,
          });
        }
      }
    }
  } else {
    // Generar puntos para 4, 16, 64 y 256-QAM
    const side = Math.sqrt(qamValue);
    const step = 2 / side;
    for (let i = 0; i < side; i++) {
      for (let j = 0; j < side; j++) {
        points.push({
          x: -1 + step / 2 + i * step,
          y: -1 + step / 2 + j * step,
        });
      }
    }
  }
  return points;
}

let chart;

function updateChartWithNoise(qamValue, snr) {
  const points = generateQAMPoints(qamValue);
  const currentSNR = Math.pow(10, snr / 10);
  const optimalSNR = Math.pow(qamValue, 2) - 1;
  const penalty = Math.max(1, Math.min(optimalSNR / currentSNR, 3));
  const evm = 1 / Math.sqrt(currentSNR);

  const noisyPoints = points.flatMap((point) => {
    return Array.from({ length: 16 }, () => {
      const angle = Math.random() * 2 * Math.PI;
      const distance = (Math.random() * evm + Number.EPSILON) * penalty;
      return {
        x: point.x + distance * Math.cos(angle),
        y: point.y + distance * Math.sin(angle),
      };
    });
  });

  if (chart) {
    chart.destroy();
  }

  const gridSize =
    qamValue === 8 ? 4 : qamValue === 32 ? 6 : Math.sqrt(qamValue);
  const step = 2 / gridSize;

  const boxAnnotations = points.map((point, index) => ({
    type: "box",
    xMin: point.x - step / 2,
    xMax: point.x + step / 2,
    yMin: point.y - step / 2,
    yMax: point.y + step / 2,
    backgroundColor: "transparent",
    borderColor: "rgba(255, 0, 0, 0.5)",
    borderWidth: 1,
  }));

  chart = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Símbolo Recibido",
          data: noisyPoints,
          pointBackgroundColor: "blue",
          pointRadius: 2,
        },
        {
          label: "Símbolo Ideal",
          data: points,
          pointBackgroundColor: "red",
          pointRadius: 5,
        },
      ],
    },
    options: {
      aspectRatio: 1,
      scales: {
        x: {
          type: "linear",
          position: "center",
          min: -1.5,
          max: 1.5,
          title: {
            display: true,
            text: "Fase",
          },
        },
        y: {
          type: "linear",
          position: "center",
          min: -1.5,
          max: 1.5,
          title: {
            display: true,
            text: "Cuadratura",
          },
        },
      },
      plugins: {
        legend: {
          display: true,
        },
        annotation: {
          annotations: boxAnnotations,
        },
      },
    },
  });
}

function calculateQAM(snr) {
  const M = Math.sqrt(Math.pow(10, snr / 10) + 1);
  const qamOptions = [4, 8, 16, 32, 64, 256];
  return qamOptions.reduce((prev, curr) => (curr <= M ? curr : prev));
}

function updateRecommendedQAM(snr) {
  const qam = calculateQAM(snr);
  recommendedQamInput.value = qam + "-QAM";
  return qam;
}

qamSelect.addEventListener("change", (event) => {
  const qamValue = parseInt(event.target.value);
  const snr = parseFloat(snrRange.value);
  updateChartWithNoise(qamValue, snr);
});

snrRange.addEventListener("input", (event) => {
  const snr = parseFloat(event.target.value);
  snrValue.textContent = snr.toFixed(3) + " dB";
  const qamValue = updateRecommendedQAM(snr);
  updateChartWithNoise(parseInt(qamSelect.value), snr);
});

// Inicializar el gráfico con 4-QAM
const initialSNR = parseFloat(snrRange.value);
updateRecommendedQAM(initialSNR);
updateChartWithNoise(4, initialSNR);
