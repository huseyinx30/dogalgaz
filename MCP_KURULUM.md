# 🔗 Supabase MCP Kurulum Rehberi

## MCP Nedir?

Model Context Protocol (MCP), AI asistanlarınızın (Cursor gibi) Supabase projenize bağlanmasını ve veritabanınızı sorgulamasını sağlar.

## ✅ Kurulum Tamamlandı

`.cursor/mcp.json` dosyası oluşturuldu ve yapılandırıldı.

## 🔧 Yapılandırma Detayları

### Mevcut Yapılandırma

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

**Proje ID**: `xwbmokmfajyoxbtbgooi`

## 📋 Sonraki Adımlar

### 1. Cursor'u Yeniden Başlatın
- Cursor'u tamamen kapatın
- Tekrar açın
- MCP server otomatik olarak bağlanacak

### 2. Authentication (İlk Kez)
Cursor ilk kez bağlanırken:
1. Bir tarayıcı penceresi açılacak
2. Supabase hesabınıza giriş yapın
3. Organization erişimini onaylayın
4. Projenizi seçin

### 3. MCP Bağlantısını Kontrol Edin
Cursor'da:
1. **Settings** → **Cursor Settings** → **Tools & MCP** bölümüne gidin
2. Supabase MCP server'ın bağlı olduğunu kontrol edin

## 🛠️ MCP ile Neler Yapabilirsiniz?

### Veritabanı İşlemleri
- Tabloları listeleme
- SQL sorguları çalıştırma
- Migration uygulama
- TypeScript tipleri oluşturma

### Debugging
- Logları görüntüleme
- Güvenlik ve performans önerileri alma

### Development
- Proje URL'lerini alma
- API key'lerini alma
- Edge Functions yönetimi

## ⚙️ Yapılandırma Seçenekleri

### Read-Only Mode (Sadece Okuma)
Güvenlik için read-only modunu etkinleştirebilirsiniz:

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

### Özellik Grupları
Sadece belirli özellikleri etkinleştirmek için:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?features=database,docs",
      "args": [
        "--project-ref",
        "xwbmokmfajyoxbtbgooi"
      ]
    }
  }
}
```

## 🔐 Güvenlik Notları

⚠️ **ÖNEMLİ**: 
- MCP'yi **sadece development projelerinde** kullanın
- **Production verilerine bağlanmayın**
- Her tool call'ı **manuel olarak onaylayın**
- Read-only mode kullanmayı düşünün

## 📚 Kullanım Örnekleri

MCP bağlandıktan sonra Cursor'da şunları sorabilirsiniz:

- "What tables are in the database?"
- "Show me the schema of the customers table"
- "Generate TypeScript types for my database"
- "What are the recent errors in the logs?"

## 🔍 Sorun Giderme

### MCP Bağlanmıyor
1. Cursor'u yeniden başlatın
2. `.cursor/mcp.json` dosyasının doğru olduğundan emin olun
3. Settings → Tools & MCP'de bağlantı durumunu kontrol edin

### Authentication Hatası
1. Tarayıcıda Supabase'e giriş yaptığınızdan emin olun
2. Organization erişimini onayladığınızdan emin olun
3. Doğru projeyi seçtiğinizden emin olun

### Proje Bulunamıyor
- Proje ID'nin doğru olduğundan emin olun: `xwbmokmfajyoxbtbgooi`
- Supabase Dashboard'da projenizin aktif olduğunu kontrol edin

## 📖 Daha Fazla Bilgi

- [Supabase MCP Dokümantasyonu](https://supabase.com/docs/guides/getting-started/mcp#cursor)
- [MCP GitHub Repository](https://github.com/supabase-community/supabase-mcp)

---

**🎉 MCP kurulumu tamamlandı! Cursor'u yeniden başlattığınızda bağlantı otomatik olarak kurulacak.**
