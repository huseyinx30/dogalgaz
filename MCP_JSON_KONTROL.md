# 🔍 MCP.json Dosyası Kontrol ve Düzeltme Rehberi

## ✅ Doğru Format

`.cursor/mcp.json` dosyanız şu formatta olmalıdır:

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

## 🔑 Token Ekleme (Opsiyonel)

Token eklemek isterseniz (OAuth yerine):

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp",
      "headers": {
        "Authorization": "Bearer sbp_xxxxxxxxxxxxx"
      },
      "args": [
        "--project-ref",
        "xwbmokmfajyoxbtbgooi"
      ]
    }
  }
}
```

**ÖNEMLİ:**
- Token'ın başında `Bearer ` olmalı (boşluk ile birlikte)
- Token formatı: `sbp_` ile başlar
- Token olmadan da OAuth ile çalışabilir

## ✅ Kontrol Listesi

Dosyanızda şunları kontrol edin:

- [ ] `mcpServers` ana anahtarı var mı?
- [ ] `supabase` server adı doğru mu?
- [ ] `url` doğru mu? (`https://mcp.supabase.com/mcp`)
- [ ] `args` array'i var mı?
- [ ] `--project-ref` argümanı var mı?
- [ ] Proje ID doğru mu? (`xwbmokmfajyoxbtbgooi`)
- [ ] JSON formatı geçerli mi? (virgüller, tırnaklar)
- [ ] Token varsa `Bearer ` prefix'i var mı?

## ❌ Yaygın Hatalar

### Hata 1: JSON Syntax Hatası
```json
// YANLIŞ - Virgül eksik
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp"
      "args": [...]
    }
  }
}

// DOĞRU
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp",
      "args": [...]
    }
  }
}
```

### Hata 2: Token Formatı
```json
// YANLIŞ - Bearer prefix yok
"Authorization": "sbp_xxxxxxxxxxxxx"

// DOĞRU
"Authorization": "Bearer sbp_xxxxxxxxxxxxx"
```

### Hata 3: Proje ID Yanlış
```json
// YANLIŞ
"args": ["--project-ref", "wrong-project-id"]

// DOĞRU
"args": ["--project-ref", "xwbmokmfajyoxbtbgooi"]
```

## 🔧 Manuel Kontrol

Dosyayı manuel olarak kontrol etmek için:

1. `.cursor/mcp.json` dosyasını açın
2. JSON formatını kontrol edin (virgüller, tırnaklar)
3. Proje ID'yi kontrol edin
4. Token varsa formatını kontrol edin

## 🧪 Test

MCP'nin çalışıp çalışmadığını test etmek için:

1. Cursor'u yeniden başlatın
2. Settings → Tools & MCP'de durumu kontrol edin
3. Cursor chat'te şunu deneyin:
   ```
   What tables are in my Supabase database? Use MCP tools.
   ```

## 📝 Örnek Tam Dosya

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

Token ile:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp",
      "headers": {
        "Authorization": "Bearer sbp_xxxxxxxxxxxxx"
      },
      "args": [
        "--project-ref",
        "xwbmokmfajyoxbtbgooi"
      ]
    }
  }
}
```

---

**💡 İpucu:** MCP çalışıyorsa (daha önce test ettik), dosya formatı doğru demektir. Sadece token eklemek istiyorsanız yukarıdaki formata göre ekleyin.
