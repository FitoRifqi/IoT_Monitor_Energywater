const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Data terbaru
let latestData = {
  tegangan: 0,
  persentase: 0,
  statusAir: "Tidak Terdeteksi",
  sensorId: "simulasi",
  timestamp: new Date(),
};

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/api/data", (req, res) => {
  res.json(latestData);
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

    // Kirim ke semua client
    io.emit("arduinoData", latestData);

    res.json({ success: true, message: "Data diterima" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Error" });
  }
});

// Simulasi data (fallback)
setInterval(() => {
  const timeDiff = new Date() - latestData.timestamp;
  if (timeDiff > 10000 && latestData.sensorId === "simulasi") {
    latestData = {
      tegangan: parseFloat((3.5 + Math.random() * 1.5).toFixed(2)),
      persentase: Math.floor(20 + Math.random() * 80),
      statusAir: Math.random() > 0.7 ? "Terdeteksi Air" : "Kering",
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

  socket.on("disconnect", () => {
    console.log("❌ Client terputus:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 ==================================");
  console.log("✅ Server berjalan di http://localhost:" + PORT);
  console.log("📊 Dashboard: http://localhost:" + PORT);
  console.log("🔧 Admin Panel: http://localhost:" + PORT + "/admin");
  console.log("🚀 ==================================");
});
