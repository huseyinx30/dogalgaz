# ⚡ MCP Hızlı Test

## ✅ Token Formatı Düzeltildi!

Token'a `Bearer ` prefix'i eklendi. Artık doğru formatta:
```
Bearer sbp_ee58b6cb65f6e03c4744a190ea2de1f97765ca44
```

## 🧪 Şimdi Test Edelim

### Adım 1: Cursor'u Yeniden Başlatın
1. Cursor'u **tamamen kapatın** (tüm pencereler)
2. **Tekrar açın**
3. MCP otomatik olarak bağlanmaya çalışacak

### Adım 2: MCP Durumunu Kontrol Edin

**Yöntem 1: Settings Üzerinden**
1. `Ctrl + ,` (veya `Cmd + ,` Mac'te)
2. Arama kutusuna **"MCP"** yazın
3. **Tools & MCP** bölümüne gidin
4. **Supabase** server'ın durumunu kontrol edin:
   - ✅ **Yeşil** = Bağlı ve çalışıyor
   - ⚠️ **Sarı** = Bağlanıyor
   - ❌ **Kırmızı** = Hata var

**Yöntem 2: Cursor Chat'te Test**
Cursor chat'inde şunu yazın:
```
What tables are in my Supabase database? Use MCP tools.
```

Eğer MCP çalışıyorsa, Supabase'deki tabloları listeleyecektir.

### Adım 3: Test Sorguları

Cursor chat'te şu komutları deneyin:

#### 1. Tablo Listesi
```
List all tables in my database. Use MCP tools.
```

#### 2. Müşteri Sayısı
```
How many customers are in the database? Use MCP tools.
```

#### 3. Schema Görüntüle
```
Show me the schema of the customers table. Use MCP tools.
```

#### 4. SQL Sorgusu
```
Execute SQL: SELECT COUNT(*) as total FROM customers. Use MCP tools.
```

## 🎯 Beklenen Sonuçlar

### Başarılı Bağlantı
- Cursor chat'te MCP araçları çalışır
- Supabase veritabanı sorguları yanıt verir
- Tablo listesi, schema bilgileri görüntülenir

### Bağlantı Hatası
Eğer hata alırsanız:
1. Token'ın geçerli olduğundan emin olun
2. Cursor'u yeniden başlatın
3. Settings → Tools & MCP'de hata mesajını kontrol edin

## 📊 Veritabanı Tabloları (Beklenen)

MCP çalışıyorsa, şu tabloları görmelisiniz:

- ✅ `profiles` - Kullanıcı profilleri
- ✅ `customers` - Müşteriler
- ✅ `suppliers` - Tedarikçiler
- ✅ `products` - Ürünler
- ✅ `sales` - Satışlar
- ✅ `purchases` - Satın almalar
- ✅ `teams` - Ekipler
- ✅ `job_tracking` - İş takibi
- ✅ Ve diğer tablolar...

## 🔧 Sorun Giderme

### "MCP tools not found" Hatası
- Cursor'u yeniden başlatın
- Settings → Tools & MCP'de Supabase'in aktif olduğundan emin olun

### "Unauthorized" Hatası
- Token'ın geçerli olduğundan emin olun
- Supabase Dashboard → Access Tokens'da token'ı kontrol edin

### "Connection timeout" Hatası
- İnternet bağlantınızı kontrol edin
- Firewall ayarlarını kontrol edin

## ✅ Test Sonucu

Test sonucunuzu paylaşın:
- [ ] MCP bağlandı mı? (Evet/Hayır)
- [ ] Hangi test sorguları çalıştı?
- [ ] Hata var mı? (Varsa detayını yazın)

---

**🎉 Token formatı düzeltildi! Cursor'u yeniden başlatıp test edin!**
