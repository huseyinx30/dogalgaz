# Doğalgaz CRM - Özellikler Dokümantasyonu

Bu dokümantasyon, sistemin tüm özelliklerini ve kullanım senaryolarını açıklar.

## 📋 İçindekiler

1. [Kullanıcı Yönetimi](#kullanıcı-yönetimi)
2. [Müşteri Yönetimi](#müşteri-yönetimi)
3. [Tedarikçi Yönetimi](#tedarikçi-yönetimi)
4. [Stok Yönetimi](#stok-yönetimi)
5. [Ön Muhasebe](#ön-muhasebe)
6. [Teklif ve Sözleşme](#teklif-ve-sözleşme)
7. [İş Takibi](#iş-takibi)
8. [Ekip Yönetimi](#ekip-yönetimi)
9. [Dashboard](#dashboard)
10. [İletişim](#iletişim)
11. [Ayarlar](#ayarlar)

---

## 👥 Kullanıcı Yönetimi

### Roller

- **Admin**: Tüm yetkilere sahip, sistem yöneticisi
- **Personel**: Admin tarafından belirlenen yetkilere sahip
- **Ekip**: Sadece kendi işlerini ve ödemelerini görebilir

### Özellikler

- Kullanıcı oluşturma ve düzenleme
- Rol atama
- Yetki yönetimi
- Profil yönetimi
- Şifre değiştirme

---

## 👤 Müşteri Yönetimi

### Müşteri Bilgileri

- Firma adı (opsiyonel)
- İletişim kişisi
- Email ve telefon
- Vergi bilgileri (Vergi No, Vergi Dairesi)
- Adres bilgileri (Adres, İl, İlçe, Posta Kodu)
- Notlar

### Müşteri Projeleri

Her müşteri için birden fazla proje tanımlanabilir:
- **Ev**: Konut projeleri
- **Yapı**: Bina projeleri
- **İş Yeri**: Ticari projeler

### İş Takip Sistemi

Müşteri işleri için durum takibi:
1. **Satıldı**: Satış yapıldı
2. **İş Yapımına Başlandı**: İşe başlandı
3. **Devam Ediyor**: İş devam ediyor
4. **Gaz Açımına Geçildi**: Gaz açımı aşamasına geçildi
5. **Gaz Açımı Yapıldı**: Gaz açımı tamamlandı
6. **Tamamlandı**: İş tamamen bitti

### İş Adımları

Devam ediyor durumunda detaylı adımlar:
- Kombi Montajı
- İç Gaz Montajı
- Kolon
- Kolektör Taşıma
- Su Taşıma
- Full Montaj
- Proje
- Gaz Açımı

---

## 🚚 Tedarikçi Yönetimi

### Tedarikçi Bilgileri

- Firma adı
- İletişim kişisi
- Email ve telefon
- Vergi bilgileri
- Adres bilgileri
- Notlar

### Satın Alma İşlemleri

- Fatura numarası ve tarihi
- Ürün listesi (ürün, miktar, birim fiyat)
- İskonto yönetimi
- KDV hesaplama
- Ödeme şekli
- Ödeme durumu takibi
- Borç bakiye hesaplama

### Ödeme Takibi

- Ödeme kayıtları
- Ödeme şekli (Nakit, Kredi Kartı, Havale, vb.)
- Referans numarası
- Kalan bakiye

---

## 📦 Stok Yönetimi

### Ürün Yönetimi

- Ürün adı ve kodu
- Kategori
- Birim (adet, kg, m, vb.)
- Alış fiyatı
- Satış fiyatı
- Stok miktarı
- Minimum stok seviyesi
- Açıklama

### Stok Hareketleri

Otomatik stok takibi:
- **Giriş**: Satın alma işlemlerinde
- **Çıkış**: Satış işlemlerinde
- **Düzeltme**: Manuel düzeltmeler

### Stok Uyarıları

Minimum stok seviyesinin altına düşen ürünler için uyarı sistemi.

---

## 💰 Ön Muhasebe

### Satın Alma Yönetimi

- Tedarikçiden ürün alma
- Fatura oluşturma
- İskonto ve KDV hesaplama
- Otomatik stok güncelleme
- Ödeme takibi

### Satış Yönetimi

- Müşteriye satış yapma
- Ürün seçimi ve miktar
- İskonto uygulama
- KDV hesaplama
- Ödeme şekli seçimi
- Otomatik stok düşürme
- Fatura oluşturma

### Ödeme Şekilleri

- Nakit
- Kredi Kartı
- Banka Havalesi
- Çek
- Senet
- Kredi Kartı Taksit

### Ödeme Durumları

- Beklemede
- Kısmen Ödendi
- Ödendi

---

## 📄 Teklif ve Sözleşme

### Teklif Modülü

- Müşteri ve proje seçimi
- Ürün listesi ekleme
- Fiyatlandırma
- İskonto uygulama
- Geçerlilik tarihi
- Teklif durumu (Beklemede, Onaylandı, Reddedildi, İptal)

### Sözleşme Modülü

- Tekliften sözleşme oluşturma
- İş başlangıç ve bitiş tarihleri
- Çift taraflı imza sistemi
- Ödeme planı
- Sözleşme yazdırma
- Durum takibi (Taslak, İmzalandı, Onaylandı, İptal)

---

## 🔧 İş Takibi

### İş Durumu Takibi

Her satış için detaylı iş takibi:
- Durum güncellemeleri
- Adım bazlı ilerleme
- Notlar ve açıklamalar
- Güncelleme geçmişi

### İş Adımları

- Kombi Montajı
- İç Gaz Montajı
- Kolon
- Kolektör Taşıma
- Su Taşıma
- Full Montaj
- Proje
- Gaz Açımı

---

## 👷 Ekip Yönetimi

### Ekip Oluşturma

- Ekip adı
- Ekip lideri seçimi
- Ekip üyeleri ekleme
- Aktif/Pasif durumu

### İş Atama

- Müşteri projesine ekip atama
- İş tipi seçimi (Kombi Montajı, İç Gaz, vb.)
- Planlanan başlangıç ve bitiş tarihleri
- Fiyat belirleme
- Durum takibi (Atandı, Başlandı, Tamamlandı, İptal)

### Ekip Ödeme Takibi

- Ekip alacakları
- Ekip borçları
- Ödeme kayıtları
- Ödeme şekli
- Kalan bakiye
- Ekip kendi panelinde görüntüleme

---

## 📊 Dashboard

### İstatistikler

- Toplam müşteri sayısı
- Toplam satış sayısı ve tutarı
- Stok ürün sayısı
- Aktif ekip sayısı

### Yaklaşan İşler

- Tarih bazlı iş listesi
- Müşteri bilgileri
- İş durumu

### Takvim Görünümü

- Ekip iş planlaması
- Tarih bazlı görünüm
- İş atamaları

### Bildirimler

- Sistem bildirimleri
- Okunmamış bildirim sayısı
- Bildirim geçmişi

---

## 📱 İletişim

### Toplu Mesajlaşma

- SMS gönderme
- WhatsApp mesajı gönderme
- Email gönderme

### İletişim Logları

- Gönderilen mesajlar
- Gönderim tarihi
- Gönderim durumu
- Mesaj tipi

### Müşteri İletişim Butonları

Her müşteri sayfasında:
- SMS gönder
- WhatsApp gönder
- Email gönder

---

## ⚙️ Ayarlar

### Genel Ayarlar

- Firma bilgileri
- İletişim bilgileri
- SMS API ayarları
- WhatsApp API ayarları
- SMTP ayarları

### Yetki Ayarları

- Rol bazlı yetki yönetimi
- Yetki kontrol listesi
- Admin, Personel, Ekip yetkileri

### Kullanıcı Yönetimi

- Kullanıcı ekleme/düzenleme
- Rol atama
- Aktif/Pasif durumu
- Şifre sıfırlama

---

## 🔍 Gelişmiş Arama

Tüm modüllerde gelişmiş arama özellikleri:
- Anlık arama
- Filtreleme
- Sıralama
- Sayfalama

---

## 📈 Raporlama

### Satış Raporları

- Tarih bazlı satış raporları
- Müşteri bazlı raporlar
- Ürün bazlı raporlar

### Stok Raporları

- Stok durumu
- Stok hareketleri
- Düşük stok uyarıları

### Finansal Raporlar

- Gelir/Gider raporları
- Ödeme durumu raporları
- Borç/Alacak raporları

---

## 🖨️ Yazdırma

### Yazdırılabilir Belgeler

- Teklifler
- Sözleşmeler
- Faturalar
- Satın alma belgeleri

### Yazdırma Özellikleri

- PDF formatında indirme
- Yazdırma önizleme
- Özelleştirilebilir şablonlar

---

## 🔐 Güvenlik

### Kimlik Doğrulama

- Email/Şifre ile giriş
- Supabase Auth entegrasyonu
- Oturum yönetimi

### Yetkilendirme

- Rol bazlı erişim kontrolü
- Sayfa bazlı yetkilendirme
- API endpoint koruması

---

## 📝 Notlar

- Tüm işlemler loglanır
- Kullanıcı bazlı işlem takibi
- Zaman damgalı kayıtlar
- Geri alınamaz işlemler için onay mekanizması

---

## 🚀 Gelecek Özellikler

- Mobil uygulama
- Gelişmiş raporlama
- API entegrasyonları
- Otomatik bildirimler
- Çoklu dil desteği
- Tema özelleştirme
