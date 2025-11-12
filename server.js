const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const cors = require("cors"); // TAMBAHAN: Untuk izin browser

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(cors()); // TAMBAHAN: Terapkan CORS

// Data terbaru
let latestData = {
  tegangan: 0,
  persentase: 0,
  statusAir: "Tidak Terdeteksi",
  sensorId: "simulasi",
  timestamp: new Date(),
};

// --- Status LED Global ---
let statusLed = "OFF";

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API untuk menerima data dari ESP8266
app.post("/api/data", (req, res) => {
  try {
    console.log("📥 Data diterima dari ESP8266:", req.body);

    latestData = {
      tegangan: parseFloat(req.body.tegangan),
      persentase: parseInt(req.body.persentase),
      statusAir: req.body.statusAir,
      sensorId: req.body.sensorId || "ESP8266",
      timestamp: new Date(),
    };

    // Kirim ke semua client website
    io.emit("arduinoData", latestData);

    res.json({ success: true, message: "Data diterima" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Error" });
  }
});

// --- KONTROL LED ---

// 1. Endpoint untuk WEBSITE mengirim perintah
app.post("/api/led-status", (req, res) => {
  const { status } = req.body;
  if (status === "ON" || status === "OFF") {
    statusLed = status;
    console.log("💡 Perintah LED diterima: " + statusLed);

    // --- INI PERBAIKANNYA ---
    // Siarkan status LED baru ke semua klien (website)
    io.emit("ledStatusUpdate", { status: statusLed });
    // ------------------------

    res.status(200).send({ message: "Status LED diperbarui" });
  } else {
    res.status(400).send({ message: "Perintah tidak valid" });
  }
});

// 2. Endpoint untuk NODEMCU bertanya status
app.get("/api/led-status", (req, res) => {
  res.json({ status: statusLed });
});
// -----------------------

// Simulasi data (fallback)
setInterval(() => {
  const timeDiff = new Date() - latestData.timestamp;
  if (timeDiff > 10000 && latestData.sensorId === "simulasi") {
    latestData = {
      tegangan: parseFloat((3.5 + Math.random() * 1.5).toFixed(2)),
      persentase: Math.floor(20 + Math.random() * 80),
      statusAir: Math.random() > 0.7 ? "TERDETEKSI" : "KERING",
      sensorId: "simulasi",
      timestamp: new Date(),
    };

    console.log("📊 Data simulasi terkirim:", latestData);
    io.emit("arduinoData", latestData);
  }
}, 5000);

// Socket.io connection
io.on("connection", (socket) => {
  console.log("✅ Client terhubung:", socket.id);
  socket.emit("arduinoData", latestData);
  socket.emit("ledStatusUpdate", { status: statusLed }); // Kirim status LED saat baru konek

  socket.on("disconnect", () => {
    console.log("❌ Client terputus:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 ==================================");
  console.log("✅ Server berjalan di http://localhost:" + PORT);
  console.log("🚀 ==================================");
});
