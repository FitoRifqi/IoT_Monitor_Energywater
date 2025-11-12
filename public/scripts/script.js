class MonitorDashboard {
  constructor() {
    this.socket = io();
    this.batteryData = {
      percentages: [],
      voltages: [],
      timestamps: [],
      maxDataPoints: 20, // Menyimpan 20 data terakhir
    };
    this.chart = null;
    this.init();
  }

  init() {
    this.setupSocketListeners();
    this.initializeChart();
    this.updateDisplay({
      tegangan: 0,
      persentase: 0,
      statusAir: "Tidak Terdeteksi",
      timestamp: new Date(),
    });
  }

  initializeChart() {
    const ctx = document.getElementById("batteryChart").getContext("2d");
    this.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Level Baterai (%)",
            data: [],
            borderColor: "#ffffff",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "#ffffff",
            pointBorderColor: "#ff6b6b",
            pointBorderWidth: 2,
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: "#ffffff",
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
          },
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: {
              color: "#ffffff",
              callback: function (value) {
                return value + "%";
              },
            },
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
          },
          x: {
            ticks: {
              color: "#ffffff",
              maxTicksLimit: 8,
            },
            grid: {
              color: "rgba(255, 255, 255, 0.1)",
            },
          },
        },
      },
    });
  }

  setupSocketListeners() {
    this.socket.on("connect", () => {
      this.updateConnectionStatus(true);
    });

    this.socket.on("disconnect", () => {
      this.updateConnectionStatus(false);
    });

    this.socket.on("arduinoData", (data) => {
      this.updateDisplay(data);
      this.updateChart(data);
      this.updateStatistics();
    });
  }

  updateDisplay(data) {
    // Update energi
    document.getElementById("tegangan").textContent = data.tegangan.toFixed(2);
    document.getElementById("persentaseDaya").textContent =
      data.persentase + "%";

    // Update progress bar
    const progressBar = document.getElementById("progressBar");
    progressBar.style.width = data.persentase + "%";

    // Update warna progress bar berdasarkan persentase
    if (data.persentase < 20) {
      progressBar.style.background = "#ff7675";
    } else if (data.persentase < 50) {
      progressBar.style.background = "#fdcb6e";
    } else {
      progressBar.style.background = "#55efc4";
    }

    // Update status air
    const statusAir = document.getElementById("statusAir");
    const waterCard = document.getElementById("waterCard");
    const waterIcon = document.getElementById("waterIcon");

    statusAir.textContent = data.statusAir;

    if (data.statusAir === "Terdeteksi Air") {
      waterCard.classList.add("water-detected");
      waterCard.classList.remove("water-dry");
      waterIcon.className = "fas fa-tint icon-large";
      statusAir.innerHTML =
        '<i class="fas fa-exclamation-triangle me-2"></i>Terdeteksi Air';
    } else {
      waterCard.classList.add("water-dry");
      waterCard.classList.remove("water-detected");
      waterIcon.className = "fas fa-tint-slash icon-large";
      statusAir.innerHTML = '<i class="fas fa-check me-2"></i>Kering';
    }

    // Update timestamp
    const now = new Date(data.timestamp);
    document.getElementById("lastUpdate").textContent =
      now.toLocaleTimeString("id-ID");
  }

  updateChart(data) {
    // Tambah data baru
    this.batteryData.percentages.push(data.persentase);
    this.batteryData.voltages.push(data.tegangan);
    this.batteryData.timestamps.push(
      new Date(data.timestamp).toLocaleTimeString("id-ID")
    );

    // Batasi jumlah data
    if (this.batteryData.percentages.length > this.batteryData.maxDataPoints) {
      this.batteryData.percentages.shift();
      this.batteryData.voltages.shift();
      this.batteryData.timestamps.shift();
    }

    // Update chart
    if (this.chart) {
      this.chart.data.labels = this.batteryData.timestamps;
      this.chart.data.datasets[0].data = this.batteryData.percentages;
      this.chart.update("none");
    }

    // Update info chart
    document.getElementById("currentVoltage").textContent =
      data.tegangan.toFixed(2);
    document.getElementById("currentLevel").textContent = data.persentase;
    document.getElementById("dataPoints").textContent =
      this.batteryData.percentages.length;
  }

  updateStatistics() {
    if (this.batteryData.percentages.length > 0) {
      const percentages = this.batteryData.percentages;
      const voltages = this.batteryData.voltages;

      const minPercent = Math.min(...percentages);
      const maxPercent = Math.max(...percentages);
      const avgPercent = Math.round(
        percentages.reduce((a, b) => a + b) / percentages.length
      );

      const minVoltage = Math.min(...voltages).toFixed(2);
      const maxVoltage = Math.max(...voltages).toFixed(2);
      const avgVoltage = (
        voltages.reduce((a, b) => a + b) / voltages.length
      ).toFixed(2);

      // Tentukan trend
      let trend = "STABIL";
      if (percentages.length >= 2) {
        const last = percentages[percentages.length - 1];
        const prev = percentages[percentages.length - 2];
        trend = last > prev ? "NAIK" : last < prev ? "TURUN" : "STABIL";
      }

      document.getElementById("minBattery").textContent = minPercent + "%";
      document.getElementById("maxBattery").textContent = maxPercent + "%";
      document.getElementById("avgBattery").textContent = avgPercent + "%";
      document.getElementById("minVoltage").textContent = minVoltage;
      document.getElementById("maxVoltage").textContent = maxVoltage;
      document.getElementById("avgVoltage").textContent = avgVoltage;
      document.getElementById("batteryTrend").textContent = trend;
    }
  }

  updateConnectionStatus(connected) {
    const statusElement = document.getElementById("connectionStatus");
    if (connected) {
      statusElement.textContent = "TERHUBUNG";
      statusElement.className = "badge bg-success";
    } else {
      statusElement.textContent = "TERPUTUS";
      statusElement.className = "badge bg-danger";
    }
  }
}

// Inisialisasi dashboard ketika halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
  new MonitorDashboard();
});
