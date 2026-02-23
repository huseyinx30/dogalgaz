# 🔄 Cursor'u Yeniden Başlatma

## 📋 Adım Adım Talimatlar

### Windows'ta Cursor'u Yeniden Başlatma

#### Yöntem 1: Menüden Kapatma ve Açma
1. **Cursor penceresini kapatın**
   - Sağ üst köşedeki **X** butonuna tıklayın
   - Veya `Alt + F4` tuşlarına basın

2. **Tüm Cursor pencerelerini kapatın**
   - Görev çubuğunda Cursor simgesine sağ tıklayın
   - **Tüm pencereleri kapat** seçeneğini seçin

3. **Cursor'u tekrar açın**
   - Başlat menüsünden Cursor'u açın
   - Veya masaüstündeki kısayoldan açın

#### Yöntem 2: Görev Yöneticisi ile Kapatma
1. **Görev Yöneticisi'ni açın**
   - `Ctrl + Shift + Esc` tuşlarına basın
   - Veya `Ctrl + Alt + Del` → Görev Yöneticisi

2. **Cursor işlemlerini bulun**
   - "İşlemler" sekmesinde "Cursor" yazın
   - Tüm Cursor işlemlerini seçin

3. **İşlemleri sonlandırın**
   - Sağ tıklayın → **Görevi sonlandır**
   - Veya seçip `Delete` tuşuna basın

4. **Cursor'u tekrar açın**

#### Yöntem 3: PowerShell ile Kapatma
```powershell
# Tüm Cursor işlemlerini kapat
Get-Process -Name "Cursor" -ErrorAction SilentlyContinue | Stop-Process -Force

# Birkaç saniye bekle
Start-Sleep -Seconds 2

# Cursor'u tekrar başlat (eğer yolu biliyorsanız)
# Start-Process "C:\Users\AKIN\AppData\Local\Programs\cursor\Cursor.exe"
```

## ✅ Yeniden Başlatma Sonrası Kontrol

Cursor'u yeniden başlattıktan sonra:

1. **Settings'i açın**
   - `Ctrl + ,` tuşlarına basın
   - Veya **File** → **Preferences** → **Settings**

2. **MCP durumunu kontrol edin**
   - Arama kutusuna **"MCP"** yazın
   - **Tools & MCP** bölümüne gidin
   - **Supabase** server'ın durumunu kontrol edin:
     - ✅ **Yeşil** = Bağlı ve çalışıyor
     - ⚠️ **Sarı** = Bağlanıyor
     - ❌ **Kırmızı** = Hata var

3. **MCP'yi test edin**
   - Cursor chat'te şunu yazın:
   ```
   What tables are in my Supabase database? Use MCP tools.
   ```

## 🔍 MCP Bağlantı Durumu

### Başarılı Bağlantı İşaretleri
- ✅ Settings → Tools & MCP'de Supabase yeşil görünür
- ✅ Cursor chat'te MCP araçları çalışır
- ✅ Veritabanı sorguları yanıt verir

### Bağlantı Sorunları
- ❌ Kırmızı işaret görüyorsanız → Hata mesajını kontrol edin
- ⚠️ Sarı işaret görüyorsanız → Birkaç saniye bekleyin
- 🔄 Hiç görünmüyorsa → Cursor'u tekrar başlatın

## 💡 İpuçları

- Cursor'u kapatırken tüm pencereleri kapattığınızdan emin olun
- Yeniden başlattıktan sonra birkaç saniye bekleyin (MCP bağlantısı için)
- Eğer hala bağlanmıyorsa, token'ı kontrol edin

---

**🎯 Şimdi Cursor'u yeniden başlatın ve MCP durumunu kontrol edin!**
