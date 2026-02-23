# 🧪 MCP Test Adımları

## ✅ Cursor'u Yeniden Başlattınız - Şimdi Test Edelim!

### 1️⃣ MCP Durumunu Kontrol Edin

**Cursor Settings'de kontrol:**
1. `Ctrl + ,` tuşlarına basın (Settings açılır)
2. Arama kutusuna **"MCP"** yazın
3. **Tools & MCP** bölümüne gidin
4. **Supabase** server'ın durumunu kontrol edin:
   - ✅ **Yeşil nokta** = Bağlı ve çalışıyor
   - ⚠️ **Sarı nokta** = Bağlanıyor (birkaç saniye bekleyin)
   - ❌ **Kırmızı nokta** = Hata var (hata mesajını kontrol edin)
   - ⚪ **Gri/Görünmüyor** = Henüz başlatılmamış

### 2️⃣ İlk Authentication (İlk Kez Bağlanıyorsanız)

Eğer ilk kez bağlanıyorsanız:
1. Bir tarayıcı penceresi otomatik açılabilir
2. Supabase hesabınıza giriş yapın
3. **Organization erişimini onaylayın**
4. Projenizi seçin: `xwbmokmfajyoxbtbgooi`

### 3️⃣ Cursor Chat'te Test Edin

Cursor chat'te (benimle konuştuğunuz yer) şu sorguları deneyin:

#### Test 1: Basit Tablo Listesi
```
What tables are in my Supabase database? Use MCP tools.
```

#### Test 2: Schema Sorgusu
```
Show me the schema of the customers table. Use MCP tools.
```

#### Test 3: Veri Sayısı
```
How many customers do I have in the database? Use MCP tools.
```

### 4️⃣ Manuel Kontrol

Eğer MCP çalışmıyorsa:

1. **`.cursor/mcp.json` dosyasını kontrol edin:**
   - Dosya var mı?
   - Proje ID doğru mu? (`xwbmokmfajyoxbtbgooi`)
   - Token varsa doğru mu?

2. **Cursor'u tekrar başlatın:**
   - Tamamen kapatın (tüm pencereleri)
   - Birkaç saniye bekleyin
   - Tekrar açın

3. **Cursor Logs'u kontrol edin:**
   - `Ctrl + Shift + P` → "Developer: Show Logs"
   - MCP ile ilgili hata mesajlarını arayın

## 🎯 Beklenen Sonuçlar

### ✅ Başarılı Bağlantı
- Settings'de Supabase yeşil görünür
- Chat'te MCP sorguları çalışır
- Veritabanı bilgileri döner

### ❌ Bağlantı Sorunları

**Eğer MCP bağlanmıyorsa:**

1. **Token eksik/yanlış:**
   - `.cursor/mcp.json` dosyasında `headers` bölümünü kontrol edin
   - Token'ı yeniden oluşturun (MCP_TOKEN_KURULUM.md'ye bakın)

2. **Proje ID yanlış:**
   - Proje ID'nin `xwbmokmfajyoxbtbgooi` olduğundan emin olun
   - Supabase Dashboard'da proje referansını kontrol edin

3. **Cursor MCP desteği:**
   - Cursor'un en son sürümünü kullandığınızdan emin olun
   - MCP özelliği aktif mi kontrol edin

## 📋 Hızlı Test Komutları

Cursor chat'te bu komutları deneyin:

```
What tables are in my database?
```

```
Show me the customers table structure
```

```
How many records are in the customers table?
```

```
List all MCP resources available
```

---

**🔍 Şimdi Settings'de MCP durumunu kontrol edin ve sonucu paylaşın!**
