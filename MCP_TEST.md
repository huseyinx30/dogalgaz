# 🧪 MCP Bağlantı Test Rehberi

## ✅ MCP Yapılandırması Kontrol Edildi

Token formatı doğru görünüyor. Şimdi bağlantıyı test edelim.

## 🔍 Test Adımları

### 1. Cursor'da MCP Durumunu Kontrol Edin

1. **Cursor Settings** açın:
   - `Ctrl + ,` (Windows) veya `Cmd + ,` (Mac)
   - Veya: **File** → **Preferences** → **Settings**

2. **Tools & MCP** bölümüne gidin:
   - Arama kutusuna "MCP" yazın
   - **Tools & MCP** seçeneğini bulun

3. **Supabase MCP Server** durumunu kontrol edin:
   - ✅ Yeşil işaret = Bağlı
   - ❌ Kırmızı işaret = Bağlantı hatası
   - ⚠️ Sarı işaret = Bağlanıyor

### 2. Cursor'da MCP'yi Test Edin

Cursor chat'inde şu komutları deneyin:

#### Veritabanı Tablolarını Listele
```
What tables are in my Supabase database? Use MCP tools.
```

#### Schema Sorgula
```
Show me the schema of the customers table. Use MCP tools.
```

#### SQL Sorgusu Çalıştır
```
Execute this SQL query: SELECT COUNT(*) FROM customers. Use MCP tools.
```

#### TypeScript Tipleri Oluştur
```
Generate TypeScript types for my database schema. Use MCP tools.
```

### 3. Manuel Test (Terminal)

Eğer Cursor'da çalışmıyorsa, token formatını kontrol edin:

```powershell
# Token formatını kontrol et
Get-Content .cursor\mcp.json
```

Token formatı şöyle olmalı:
```json
{
  "headers": {
    "Authorization": "Bearer sbp_xxxxxxxxxxxxx"
  }
}
```

⚠️ **ÖNEMLİ**: Token'ın başında `Bearer ` olmalı (boşluk ile birlikte)!

## 🐛 Sorun Giderme

### MCP Bağlanmıyor

1. **Token Formatını Kontrol Edin**
   - Token'ın başında `Bearer ` olmalı
   - Token'ın tamamı kopyalandığından emin olun

2. **Cursor'u Yeniden Başlatın**
   - Cursor'u tamamen kapatın
   - Tekrar açın
   - Settings → Tools & MCP'de durumu kontrol edin

3. **Token Geçerliliğini Kontrol Edin**
   - Supabase Dashboard → Access Tokens
   - Token'ın aktif olduğundan emin olun
   - Süresi dolmadığından emin olun

4. **Proje ID'yi Kontrol Edin**
   - Proje ID: `xwbmokmfajyoxbtbgooi`
   - Supabase Dashboard'da projenin aktif olduğunu kontrol edin

### Authentication Hatası

Eğer "Unauthorized" hatası alıyorsanız:

1. Token'ı yeniden oluşturun
2. `.cursor/mcp.json` dosyasına yeni token'ı ekleyin
3. Cursor'u yeniden başlatın

### Connection Timeout

Eğer bağlantı zaman aşımına uğruyorsa:

1. İnternet bağlantınızı kontrol edin
2. Firewall ayarlarını kontrol edin
3. Proxy ayarlarını kontrol edin

## ✅ Başarılı Bağlantı İşaretleri

MCP başarıyla bağlandığında:

- ✅ Cursor Settings → Tools & MCP'de Supabase yeşil görünür
- ✅ Cursor chat'inde MCP araçlarını kullanabilirsiniz
- ✅ "Use MCP tools" dediğinizde Supabase sorguları çalışır

## 📝 Test Sonuçları

Test sonuçlarınızı buraya not edin:

- [ ] MCP Settings'de görünüyor mu?
- [ ] Bağlantı durumu nedir? (Yeşil/Kırmızı/Sarı)
- [ ] Tablo listesi sorgusu çalışıyor mu?
- [ ] SQL sorguları çalışıyor mu?
- [ ] Hata mesajı var mı? (Varsa yazın)

---

**💡 İpucu**: MCP bağlantısı için Cursor'u yeniden başlatmanız gerekebilir!
