# Service Role Key Nasıl Alınır?

## Adımlar

1. **Supabase Dashboard** açıldı (yukarıdaki link ile).
2. **Project API keys** bölümünü bulun.
3. **anon** (public) ile **service_role** (secret) iki farklı key var:
   - `anon` → Sizin şu an `.env.local`'de olan key (YANLIŞ yerde kullanıyorsunuz)
   - `service_role` → **Reveal** butonuna tıklayın, gizli key görünecek
4. **service_role** key'in **tamamını** kopyalayın.
5. `.env.local` dosyasını açın.
6. `SUPABASE_SERVICE_ROLE_KEY=` satırının yanındaki değeri **silip** kopyaladığınız service_role key'i yapıştırın.

## Örnek

```env
# YANLIŞ - anon key (şu an böyle):
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...role":"anon"...

# DOĞRU - service_role key (bunu koyun):
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...role":"service_role"...
```

**Önemli:** İki key farklı! `anon` ile `service_role` JWT içinde `"role"` değeri farklıdır. Kullanıcı oluşturmak için mutlaka **service_role** kullanın.

7. Dosyayı kaydedin ve `npm run dev` ile sunucuyu yeniden başlatın.
