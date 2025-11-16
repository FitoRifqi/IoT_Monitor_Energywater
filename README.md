# Monitor Energi dan Air - IoT Eco-Smart Jalanan

Proyek ini adalah sistem monitoring IoT realtime untuk memantau energi yang dihasilkan dari Paving Block (Piezoelectric) dan mendeteksi genangan air. Sistem ini terdiri dari hardware (ESP8266), backend (Node.js/Express), dan frontend (HTML/TailwindCSS/Socket.io).

## Fitur Utama

  * **Monitoring Energi Realtime**: Memantau tegangan (V) dan persentase (%) baterai (superkapasitor) yang diisi oleh energi paving block.
  * **Deteksi Genangan Air**: Memberikan status "KERING" atau "TERDETEKSI" secara realtime, berguna untuk peringatan dini banjir.
  * **Dashboard Publik**: Halaman `index.html` yang menampilkan data sensor secara visual dan menarik untuk publik.
  * **Panel Admin**: Halaman `admin.html` dengan fitur:
      * Kontrol LED/Lampu Jalan (ON/OFF) dari jarak jauh.
      * Grafik (chart) historis data tegangan dan baterai menggunakan Chart.js.
      * Log aktivitas dan statistik sistem.
  * **Komunikasi Dua Arah**:
    1.  **Hardware ke Server**: ESP8266 mengirim data sensor ke server via HTTP POST.
    2.  **Server ke Klien**: Server menyebarkan data ke semua dashboard web via Socket.io.
    3.  **Klien ke Server**: Panel admin mengirim perintah (misal: kontrol LED) ke server via HTTP POST.
    4.  **Server ke Hardware**: ESP8266 mengambil status/perintah terbaru dari server via HTTP GET.
  * **Mode Simulasi**: Server akan menghasilkan data simulasi jika tidak ada data baru yang masuk dari ESP8266 setelah 10 detik.

## Teknologi yang Digunakan

  * **Backend**: Node.js, Express.js, Socket.io, CORS
  * **Frontend**: HTML, TailwindCSS, Socket.io (Client), Chart.js
  * **Hardware (IoT)**:
      * ESP8266 (NodeMCU)
      * Arduino C++ (ESP8266 Core)
      * Library: `ESP8266WiFi`, `ESP8266HTTPClient`, `WiFiClient`, `ArduinoJson`
      * Sensor Tegangan (via Pembagi Tegangan di pin `A0`)
      * Sensor Air Digital (di pin `D1`)
      * LED/Transistor (sebagai aktuator di pin `D5`)

## Susunan Project

```
/
├── ARDUINO/
│   └── arduino_code.ino      # Kode untuk ESP8266
├── node_modules/
├── public/
│   ├── index.html            # Dashboard monitoring publik
│   ├── admin.html            # Panel kontrol admin
│   ├── login.html            # Halaman login (statis)
│   └── scripts/
│       └── script.js         # Logika JS eksternal (untuk admin.html)
├── .gitignore
├── package.json
├── package-lock.json
└── server.js                 # Logika server (Express & Socket.io)
```

## Prasyarat & Instalasi

### 1\. Perangkat Keras (Hardware)

1.  Siapkan ESP8266 (NodeMCU).

2.  Rangkai sensor:

      * Hubungkan output sensor tegangan (dari pembagi tegangan) ke pin `A0`.
      * Hubungkan output sensor air digital ke pin `D1`.
      * Hubungkan basis transistor (untuk LED) ke pin `D5`.

3.  Buka `ARDUINO/arduino_code.ino` menggunakan Arduino IDE.

4.  Pastikan Anda telah menginstal library `ESP8266WiFi`, `ESP8266HTTPClient`, dan `ArduinoJson`.

5.  Ubah konfigurasi berikut di dalam file `.ino`:

    ```cpp
    // --- GANTI DENGAN DATA ANDA ---
    const char* ssid = "NAMA_WIFI_ANDA"; //
    const char* password = "PASSWORD_WIFI_ANDA"; //
    const char* serverIP = "192.168.18.111"; // GANTI DENGAN IP KOMPUTER SERVER ANDA
    ```

6.  Upload kode ke ESP8266 Anda.

### 2\. Perangkat Lunak (Server)

1.  Pastikan Anda memiliki Node.js (v18 atau lebih baru) dan npm.
2.  Clone repository ini:
    ```sh
    git clone https://github.com/fitorifqi/iot_monitor_energywater.git
    cd iot_monitor_energywater
    ```
3.  Install dependencies:
    ```sh
    npm install
    ```
4.  **PENTING**: Dapatkan Alamat IP (IPv4) lokal komputer Anda (misal: `192.168.18.111`). Pastikan IP ini **SAMA** dengan `serverIP` yang Anda masukkan di `arduino_code.ino`.
5.  **PENTING (Perbaikan)**: Buka file `public/admin.html`. Ubah `SERVER_URL` agar sesuai dengan IP server Anda, karena nilainya *hardcoded*:
    ```javascript
    // PERBAIKAN: Ganti IP ke 111
    const SERVER_URL = "http://192.168.18.111:3000"; // Ganti IP ini
    ```
6.  Jalankan server:
    ```sh
    npm start
    ```
    Atau untuk mode development (auto-reload):
    ```sh
    npm run dev
    ```
    Server akan berjalan di `http://localhost:3000`.

## Contoh Penggunaan

1.  Pastikan server Node.js berjalan (`npm start`).
2.  Nyalakan ESP8266. Buka Serial Monitor di Arduino IDE (baud rate 9600) untuk melihat log koneksi dan pengiriman data.
3.  Buka dashboard publik di browser: `http://localhost:3000` atau `http://[IP_SERVER_ANDA]:3000`.
4.  Buka panel admin di browser: `http://localhost:3000/admin.html`.
5.  Di panel admin, Anda dapat menekan tombol "NYALAKAN" atau "MATIKAN".
6.  `server.js` akan mencatat perintah ini. Saat ESP8266 melakukan request berikutnya (`ambilStatusLed()`), ESP8266 akan menerima status baru dan menyalakan/mematikan LED fisik.

## Kontribusi

Kontribusi sangat diterima\! Jika Anda memiliki ide untuk perbaikan atau menemukan bug, silakan:

1.  Fork repository ini.
2.  Buat branch baru (`git checkout -b fitur/perbaikan-baru`).
3.  Commit perubahan Anda (`git commit -m 'Menambahkan fitur baru'`).
4.  Push ke branch (`git push origin fitur/perbaikan-baru`).
5.  Buat Pull Request baru.

## Lisensi

Proyek ini dilisensikan di bawah **MIT License**.

```
Copyright (c) 2025 [Fito Rifqi Dwi Fatoni]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
