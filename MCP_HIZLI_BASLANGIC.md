# 🚀 Supabase MCP - Hızlı Başlangıç

## ✅ Kurulum Tamamlandı!

`.cursor/mcp.json` dosyası oluşturuldu ve yapılandırıldı.

## 📋 Yapılandırma Bilgileri

**Proje ID**: `xwbmokmfajyoxbtbgooi`  
**MCP Server URL**: `https://mcp.supabase.com/mcp`

## 🔄 Sonraki Adımlar

### 1. Cursor'u Yeniden Başlatın
- Cursor'u tamamen kapatın (tüm pencereleri)
- Tekrar açın
- MCP server otomatik olarak bağlanmaya çalışacak

### 2. İlk Authentication
Cursor ilk kez bağlanırken:
1. Bir tarayıcı penceresi otomatik açılacak
2. Supabase hesabınıza giriş yapın
3. **Organization erişimini onaylayın** (önemli!)
4. Projenizi seçin: `xwbmokmfajyoxbtbgooi`

### 3. Bağlantıyı Kontrol Edin
Cursor'da:
- **Settings** (⚙️) → **Cursor Settings** → **Tools & MCP**
- Supabase MCP server'ın listede olduğunu ve bağlı olduğunu kontrol edin

## 🎯 MCP ile Ne Yapabilirsiniz?

MCP bağlandıktan sonra Cursor'da doğal dilde sorular sorabilirsiniz:

### Veritabanı Sorguları
- "What tables are in my database?"
- "Show me the schema of the customers table"
- "How many customers do I have?"
- "What's the structure of the sales table?"

### TypeScript Tipleri
- "Generate TypeScript types for my database schema"
- "Create types for the customers table"

### SQL Sorguları
- "Execute this SQL: SELECT * FROM customers LIMIT 10"
- "Show me all products with low stock"

### Loglar ve Debugging
- "Show me recent API errors"
- "What are the security advisors for my project?"

## ⚙️ Yapılandırma Dosyası

Dosya konumu: `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp",
      "args": [
        "--project-ref",
        "xwbmokmfajyoxbtbgooi"
      ]
    }
  }
}
```

## 🔐 Güvenlik

⚠️ **ÖNEMLİ GÜVENLİK NOTLARI:**

1. **Sadece Development**: MCP'yi sadece development projelerinde kullanın
2. **Production'dan Uzak Durun**: Production verilerine asla bağlanmayın
3. **Manuel Onay**: Her tool call'ı manuel olarak onaylayın (Cursor'da varsayılan olarak açıktır)
4. **Read-Only Mode**: İsterseniz read-only modunu etkinleştirebilirsiniz

### Read-Only Mode Aktifleştirme

Güvenlik için read-only modunu etkinleştirmek isterseniz, `.cursor/mcp.json` dosyasını şu şekilde güncelleyin:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?read_only=true",
      "args": [
        "--project-ref",
        "xwbmokmfajyoxbtbgooi"
      ]
    }
  }
}
```

## 🐛 Sorun Giderme

### MCP Bağlanmıyor
1. Cursor'u tamamen kapatıp yeniden açın
2. `.cursor/mcp.json` dosyasının doğru konumda olduğundan emin olun
3. Settings → Tools & MCP'de bağlantı durumunu kontrol edin

### Authentication Açılmıyor
1. Cursor'u yeniden başlatın
2. Manuel olarak tarayıcıda Supabase'e giriş yapın
3. Settings → Tools & MCP'de "Reconnect" butonuna tıklayın

### Proje Bulunamıyor
- Proje ID'nin doğru olduğundan emin olun: `xwbmokmfajyoxbtbgooi`
- Supabase Dashboard'da projenizin aktif olduğunu kontrol edin
- Organization'ın doğru seçildiğinden emin olun

## 📚 Kaynaklar

- [Supabase MCP Dokümantasyonu](https://supabase.com/docs/guides/getting-started/mcp#cursor)
- [MCP GitHub Repository](https://github.com/supabase-community/supabase-mcp)

---

**🎉 Kurulum tamamlandı! Cursor'u yeniden başlattığınızda MCP otomatik olarak bağlanacak.**
