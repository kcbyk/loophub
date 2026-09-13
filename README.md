# Soundtrap Automated Audio Downloader & Harvester

Playwright ve Node.js mimarisiyle geliştirilmiş, sıfır insan müdahalesiyle çalışan, ağ seviyesinde ses yakalama (network interception), SQLite ile tekilleştirme ve Express.js canlı dashboard'u barındıran tam otomatik ses indirme sistemi.

## 🌟 Temel Özellikler

1. **Kalıcı Oturum & Cookie Desteği (Hands-Free):**
   - Kullanıcının `cookies.json` içerisindeki aktif Soundtrap oturum çerezlerini otomatik olarak Chromium tarayıcısına enjekte eder.
   - `session_data/` dizininde profil durumunu kalıcı olarak tutar; tekrar tekrar giriş yapma zorunluluğunu ortadan kaldırır.

2. **Ağ Seviyesinde Ses Yakalama (Network-Level Interception):**
   - DOM parsing kırılganlıklarına bağımlı değildir.
   - Doğrudan tarayıcının HTTP `response` ağ trafiğini dinler.
   - `audio/mpeg`, `audio/wav`, `audio/ogg`, `audio/mp3`, `.wav` CDN isteklerini anında yakalar.
   - Binary ses stream'ini disk üzerindeki `/downloaded_loops` klasörüne kaydeder.

3. **Mükerrer İndirme Engelleme (SQLite):**
   - Node.js 24'ün yerel `node:sqlite` motorunu kullanarak `data/loops.db` veritabanını tutar.
   - URL ve MD5 dosya checksum kontrolleri sayesinde aynı ses parçasının tekrar indirilmesini %100 engeller.
   - Dosyaları `ST_Loop_[ID]_[Timestamp].[ext]` biçiminde sanitize ederek depolar.

4. **Express.js Canlı Dashboard (`http://localhost:3000`):**
   - **Server-Sent Events (SSE):** Yakalanan her ses loop'u anında sayfayı yenilemeye gerek kalmadan arayüze akar.
   - **Dahili Audio Player:** İndirilen loop'ları doğrudan tarayıcıdan tek tıkla dinleme imkanı.
   - **İstatistikler:** Toplam parça adedi, disk kullanım boyutu (MB) ve anlık bağlantı durumu.

---

## 🚀 Kurulum ve Başlatma

### 1. Bağımlılıkları Yükleyin:
```bash
npm install
npx playwright install chromium
```

### 2. Sistemi Başlatın:
```bash
npm start
```

Tarayıcınız otomatik açılacak ve çerezlerinizle giriş yapıp Soundtrap Studio / Projeler sayfasına gidecektir.
Aynı anda kontrol paneline tarayıcınızdan erişebilirsiniz:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## ⚙️ Yapılandırma (`.env`)

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `PORT` | `3000` | Dashboard web portu |
| `HEADLESS` | `false` | Tarayıcının görünür açılıp açılmayacağı (`true` / `false`) |
| `DOWNLOAD_DIR` | `./downloaded_loops` | Ses dosyalarının kaydedileceği klasör |
| `SOUNDTRAP_URL` | `https://www.soundtrap.com/home/creator/projects` | Başlangıç adresi |
| `AUTO_SCROLL_DELAY_MS` | `2000` | Loop paneli otomatik kaydırma süresi (ms) |
