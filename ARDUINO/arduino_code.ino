#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>

// --- GANTI DENGAN DATA ANDA ---
const char* ssid = "Kos as 19-5G_2.4GEXT";     // Nama WiFi Anda
const char* password = "12345678"; // Password WiFi Anda
// PERBAIKAN: Ganti IP ke 111
const char* serverIP = "192.168.18.111"; // IP Address server Node.js Anda
// ---------------------------------

// --- Server ---
String urlPostData = "http://" + String(serverIP) + ":3000/api/data";
String urlGetLed = "http://" + String(serverIP) + ":3000/api/led-status";

// --- Sensor ---
const int PIN_TEGANGAN = A0; // Pin A0 untuk monitor kapasitor
const int PIN_AIR = D1;      // Pin D1 untuk sensor air digital
const int PIN_LED_KONTROL = D5; // Pin D5 untuk kontrol transistor LED

// --- Kalibrasi ---
const float R1 = 10000.0, R2 = 10000.0; // Resistor pembagi tegangan
const float V_MAX = 5.0, V_MIN = 3.0; // Rentang 0-100% kapasitor

// --- Waktu ---
unsigned long prevMillis = 0;
const long interval = 3000; // Interval 3 detik untuk kirim & ambil data

void setup() {
  Serial.begin(9600); // Pastikan Serial Monitor di 9600
  pinMode(PIN_AIR, INPUT_PULLUP); // D1 sebagai input pullup
  pinMode(PIN_LED_KONTROL, OUTPUT); // D5 sebagai output
  digitalWrite(PIN_LED_KONTROL, LOW); // Pastikan LED mati saat awal

  connectWiFi();
}

void connectWiFi() {
  Serial.print("Menghubungkan ke WiFi ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 20) {
    delay(1000);
    Serial.print(".");
    retry++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi terhubung");
    Serial.print("IP ESP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nGagal konek WiFi");
  }
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi putus, reconnect...");
    connectWiFi();
    return;
  }

  // Cek timer (non-blocking)
  if (millis() - prevMillis >= interval) {
    prevMillis = millis();
    
    // --- 1. BACA SEMUA SENSOR ---
    float tegangan = bacaTegangan();
    float persen = map(tegangan * 100, V_MIN * 100, V_MAX * 100, 0, 100);
    persen = constrain(persen, 0, 100);
    bool air = digitalRead(PIN_AIR) == LOW; // LOW berarti ada air

    // --- 2. KIRIM DATA SENSOR KE SERVER ---
    kirimData(tegangan, persen, air);

    Serial.printf("KIRIM: Tegangan: %.2f V | %.0f%% | Air: %s\n", 
                  tegangan, persen, air ? "TERDETEKSI" : "KERING");

    // --- 3. AMBIL PERINTAH LED DARI SERVER ---
    ambilStatusLed();
  }
}

// Fungsi membaca tegangan kapasitor dengan aman
float bacaTegangan() {
  int analogVal = analogRead(PIN_TEGANGAN);
  float vPin = (analogVal / 1023.0) * 3.3;
  return vPin * (R1 + R2) / R2; // Kembalikan tegangan asli
}

// Fungsi mengirim data ke server
void kirimData(float tegangan, float persen, bool air) {
  WiFiClient client;
  HTTPClient http;
  StaticJsonDocument<200> doc;

  doc["sensorId"] = "ESP8266_01";
  doc["tegangan"] = tegangan;
  doc["persentase"] = persen;
  doc["statusAir"] = air ? "TERDETEKSI" : "KERING";

  String payload;
  serializeJson(doc, payload);

  http.begin(client, urlPostData);
  http.addHeader("Content-Type", "application/json");

  int code = http.POST(payload);
  if (code > 0) {
    // Serial.printf("Response %d: %s\n", code, http.getString().c_str());
  } else {
    // Serial.printf("Gagal kirim (%d)\n", code);
  }
  http.end();
}

// Fungsi mengambil status LED dari server
void ambilStatusLed() {
  WiFiClient client;
  HTTPClient http;
  
  http.begin(client, urlGetLed);
  
  int code = http.GET();
  if (code == 200) { // Jika server merespon OK
    String payload = http.getString(); // Jawaban: {"status":"ON"}
    
    StaticJsonDocument<100> doc;
    deserializeJson(doc, payload);
    const char* status = doc["status"];

    if (strcmp(status, "ON") == 0) {
      digitalWrite(PIN_LED_KONTROL, HIGH); // Nyalakan Transistor
      Serial.println("TERIMA: Perintah NYALAKAN LED");
    } else {
      digitalWrite(PIN_LED_KONTROL, LOW); // Matikan Transistor
      Serial.println("TERIMA: Perintah MATIKAN LED");
    }
  } else {
    Serial.printf("TERIMA: Gagal ambil status LED (HTTP %d)\n", code);
  }
  http.end();
}