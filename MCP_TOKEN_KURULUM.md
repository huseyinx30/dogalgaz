# 🔑 Supabase MCP Token Kurulumu

## Token Nasıl Oluşturulur?

### 1. Supabase Dashboard'a Giriş Yapın
1. [Supabase Dashboard](https://supabase.com/dashboard) adresine gidin
2. Hesabınıza giriş yapın

### 2. Personal Access Token Oluşturun
1. Sağ üst köşedeki profil ikonuna tıklayın
2. **Access Tokens** (veya **API Tokens**) bölümüne gidin
3. **Generate New Token** butonuna tıklayın
4. Token için bir isim verin (örn: "Cursor MCP Token")
5. Gerekli scope'ları seçin:
   - ✅ Projects: Read
   - ✅ Projects: Write (eğer migration yapmak istiyorsanız)
   - ✅ Organizations: Read
6. **Generate Token** butonuna tıklayın
7. ⚠️ **ÖNEMLİ**: Token'ı hemen kopyalayın! Bir daha gösterilmeyecek!

### 3. Token'ı MCP.json'a Ekleyin

`.cursor/mcp.json` dosyasını açın ve token'ı ekleyin:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_SUPABASE_ACCESS_TOKEN_HERE"
      },
      "args": [
        "--project-ref",
        "xwbmokmfajyoxbtbgooi"
      ]
    }
  }
}
```

`YOUR_SUPABASE_ACCESS_TOKEN_HERE` yerine kopyaladığınız token'ı yapıştırın.

## 🔐 Güvenlik Notları

⚠️ **ÖNEMLİ GÜVENLİK UYARILARI:**

1. **Token'ı Asla Paylaşmayın**: Token'ınızı GitHub'a commit etmeyin, paylaşmayın
2. **.gitignore Kontrolü**: `.cursor/mcp.json` dosyasının `.gitignore`'da olduğundan emin olun
3. **Token Rotation**: Düzenli olarak token'ları yenileyin
4. **Sadece Development**: Token'ı sadece development projelerinde kullanın

## 📝 Token Olmadan Kullanım

Token olmadan da MCP kullanılabilir! İlk bağlantıda tarayıcı üzerinden OAuth ile authentication yapılır. Token sadece şu durumlarda gereklidir:

- CI/CD ortamlarında
- OAuth akışının mümkün olmadığı durumlarda
- Manuel authentication tercih edildiğinde

## 🔄 Token vs OAuth

### OAuth (Varsayılan - Önerilen)
- ✅ Daha güvenli (token otomatik yenilenir)
- ✅ Kolay kurulum
- ✅ Tarayıcı üzerinden giriş

### Personal Access Token
- ✅ CI/CD için uygun
- ✅ Manuel kontrol
- ⚠️ Token'ı manuel olarak yönetmeniz gerekir
- ⚠️ Süresi dolduğunda yenilemeniz gerekir

## 🐛 Sorun Giderme

### Token Geçersiz Hatası
- Token'ın doğru kopyalandığından emin olun
- Token'ın süresinin dolmadığını kontrol edin
- Supabase Dashboard'da token'ın aktif olduğunu kontrol edin

### Authorization Hatası
- Token formatının doğru olduğundan emin olun: `Bearer YOUR_TOKEN`
- Token'ın gerekli scope'lara sahip olduğundan emin olun
- Proje ID'nin doğru olduğundan emin olun

## 📚 Daha Fazla Bilgi

- [Supabase Access Tokens](https://supabase.com/dashboard/account/tokens)
- [Supabase MCP Documentation](https://supabase.com/docs/guides/getting-started/mcp#cursor)

---

**💡 İpucu**: Token kullanmak yerine OAuth kullanmanızı öneririz. Daha güvenli ve kolaydır!
