# .env.local Dosyası Oluşturma Rehberi

## Hızlı Kurulum

### Windows (PowerShell)
```powershell
New-Item -Path .env.local -ItemType File -Force
```

### Windows (CMD)
```cmd
type nul > .env.local
```

### Mac/Linux
```bash
touch .env.local
```

## Dosya İçeriği

`.env.local` dosyasını oluşturduktan sonra şu içeriği ekleyin:

```env
# Supabase Configuration
# Bu dosyadaki değerleri Supabase Dashboard'dan alın

# Supabase Project URL
# Settings > API > Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase Anon Key
# Settings > API > anon public key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Supabase Değerlerini Bulma

1. [Supabase Dashboard](https://app.supabase.com) adresine gidin
2. Projenizi seçin
3. Sol menüden **Settings** → **API** seçin
4. Şu bilgileri kopyalayın:
   - **Project URL**: `https://xxxxx.supabase.co` formatında
   - **anon public** key: Uzun bir string (JWT token)

## Örnek .env.local Dosyası

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.example-key-here
```

## Önemli Notlar

- `.env.local` dosyası `.gitignore` içinde olduğu için git'e commit edilmeyecek
- Bu dosya sadece yerel geliştirme için kullanılır
- Production'da bu değerler environment variables olarak ayarlanmalıdır
- Dosyayı oluşturduktan sonra sunucuyu yeniden başlatın: `npm run dev`

## Doğrulama

Dosyayı oluşturduktan sonra, terminalde şu komutu çalıştırarak kontrol edin:

```bash
# Windows PowerShell
Get-Content .env.local

# Mac/Linux
cat .env.local
```

## Sorun Giderme

### Dosya oluşturulamıyor
- Dosya zaten varsa, içeriğini düzenleyin
- Dosya izinlerini kontrol edin
- Proje kök dizininde olduğunuzdan emin olun

### Değerler çalışmıyor
- Değerlerin doğru kopyalandığından emin olun
- Boşluk veya tırnak işareti olmamalı
- Sunucuyu yeniden başlatın (`Ctrl+C` sonra `npm run dev`)
