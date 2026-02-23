import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

interface DiposData {
  taslakProjeler: string;
  onayBekleyenProje: string;
  projeKontoru: string;
  bugunReddedilenProje: string;
  bugunOnaylananProje: string;
  policeKontoru: string;
  bugunkuRandevular: string;
  lastUpdated?: string;
}

async function fetchDiposData(username: string, password: string) {
  try {
    if (!username || !password) {
      return NextResponse.json(
        {
          error: 'Kullanıcı adı ve şifre gerekli',
          taslakProjeler: '0',
          onayBekleyenProje: '0',
          projeKontoru: '0',
          bugunReddedilenProje: '0',
          bugunOnaylananProje: '0',
          policeKontoru: '0',
          bugunkuRandevular: '0',
        },
        { status: 400 }
      );
    }

    console.log('🚀 Dipos verileri çekiliyor...', { username });

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Login sayfasına git
    await page.goto('https://web.dipos.com.tr/Account/Login?ReturnUrl=%2F', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Sayfanın yüklenmesini bekle
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Login formunu daha esnek şekilde bul
    await page.evaluate(({ username, password }) => {
      // Tüm input alanlarını bul
      const inputs = Array.from(document.querySelectorAll('input'));
      
      // Kullanıcı adı input'unu bul (text veya email type)
      const usernameInput = inputs.find(input => 
        (input.type === 'text' || input.type === 'email') && 
        !input.type.includes('password')
      );
      
      // Şifre input'unu bul
      const passwordInput = inputs.find(input => input.type === 'password');
      
      if (usernameInput) {
        (usernameInput as HTMLInputElement).value = username;
        usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      if (passwordInput) {
        (passwordInput as HTMLInputElement).value = password;
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, { username, password });

    // Form submit butonunu bul ve tıkla
    await page.evaluate(() => {
      // Önce type="submit" olan butonları bul
      let submitButton = document.querySelector('button[type="submit"], input[type="submit"]') as HTMLElement;
      
      // Bulamazsa, text içeriğine göre ara
      if (!submitButton) {
        const buttons = Array.from(document.querySelectorAll('button, input[type="button"]'));
        submitButton = buttons.find(btn => {
          const text = btn.textContent?.toLowerCase() || '';
          return text.includes('giriş') || text.includes('login') || text.includes('submit');
        }) as HTMLElement;
      }
      
      if (submitButton) {
        submitButton.click();
      } else {
        // Form'u submit et
        const form = document.querySelector('form');
        if (form) {
          (form as HTMLFormElement).submit();
        }
      }
    });

    // Dashboard'a yönlendirmeyi bekle
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    } catch (e) {
      // Navigation timeout olabilir, devam et
      console.log('Navigation timeout, devam ediliyor...');
    }

    // Dashboard sayfasının yüklenmesini bekle
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Kart verilerini çek
    const data: DiposData = {
      taslakProjeler: '0',
      onayBekleyenProje: '0',
      projeKontoru: '0',
      bugunReddedilenProje: '0',
      bugunOnaylananProje: '0',
      policeKontoru: '0',
      bugunkuRandevular: '0',
    };

    try {
      // Sayfadaki tüm metinleri al
      const bodyText = await page.evaluate(() => document.body.innerText);
      const pageContent = await page.content();
      
      console.log('📄 Sayfa metni uzunluğu:', bodyText.length);
      console.log('📄 Sayfa metni (ilk 1000 karakter):', bodyText.substring(0, 1000));

      // Daha kapsamlı ve esnek regex pattern'leri
      const patterns = {
        taslakProjeler: [
          /Taslak\s+Projeler[:\s\n]*([0-9,]+(?:\.[0-9]+)?)/i,
          /Taslak\s*Projeler[^0-9]*([0-9,]+(?:\.[0-9]+)?)/i,
          /Taslak[^0-9]*([0-9,]+(?:\.[0-9]+)?)/i,
        ],
        onayBekleyenProje: [
          /Onay\s+Bekleyen\s+Proje[:\s\n]*([0-9,]+(?:\.[0-9]+)?)/i,
          /Onay\s*Bekleyen[^0-9]*([0-9,]+(?:\.[0-9]+)?)/i,
          /Onay\s+Bekleyen[^0-9]*([0-9,]+(?:\.[0-9]+)?)/i,
        ],
        projeKontoru: [
          /Proje\s+Kontörü[:\s\n]*([0-9,]+(?:\.[0-9]+)?)/i,
          /Proje\s*Kontörü[^0-9]*([0-9,]+(?:\.[0-9]+)?)/i,
          /Proje\s*Kontör[^0-9]*([0-9,]+(?:\.[0-9]+)?)/i,
        ],
        bugunReddedilenProje: [
          /Bugün\s+Reddedilen\s+Proje[:\s\n]*([0-9,]+(?:\.[0-9]+)?)/i,
          /Bugün\s*Reddedilen[^0-9]*([0-9,]+(?:\.[0-9]+)?)/i,
          /Reddedilen[^0-9]*([0-9,]+(?:\.[0-9]+)?)/i,
        ],
        bugunOnaylananProje: [
          /Bugün\s+Onaylanan\s+Proje[:\s\n]*([0-9,]+(?:\.[0-9]+)?)/i,
          /Bugün\s*Onaylanan[^0-9]*([0-9,]+(?:\.[0-9]+)?)/i,
          /Onaylanan[^0-9]*([0-9,]+(?:\.[0-9]+)?)/i,
        ],
        policeKontoru: [
          /Poliçe\s+Kontörü[:\s\n]*([0-9,]+(?:\.[0-9]+)?)/i,
          /Poliçe\s*Kontörü[^0-9]*([0-9,]+(?:\.[0-9]+)?)/i,
          /Poliçe\s*Kontör[^0-9]*([0-9,]+(?:\.[0-9]+)?)/i,
        ],
        bugunkuRandevular: [
          /Bugünkü\s+Randevular[:\s\n]*([0-9,]+(?:\.[0-9]+)?)/i,
          /Bugünkü\s*Randevular[^0-9]*([0-9,]+(?:\.[0-9]+)?)/i,
          /Randevular[^0-9]*([0-9,]+(?:\.[0-9]+)?)/i,
        ],
      };

      // Önce bodyText'te ara - her pattern için tüm varyasyonları dene
      for (const [key, patternList] of Object.entries(patterns)) {
        for (const pattern of patternList) {
          const match = bodyText.match(pattern);
          if (match && match[1]) {
            (data as any)[key] = match[1].trim();
            console.log(`✅ ${key} bulundu:`, match[1].trim());
            break; // İlk eşleşmeyi al
          }
        }
      }

      // Eğer bulamazsak pageContent'te ara
      for (const [key, patternList] of Object.entries(patterns)) {
        if ((data as any)[key] === '0') {
          for (const pattern of patternList) {
            const match = pageContent.match(pattern);
            if (match && match[1]) {
              (data as any)[key] = match[1].trim();
              console.log(`✅ ${key} HTML'den bulundu:`, match[1].trim());
              break;
            }
          }
        }
      }

      // Kart elementlerini daha detaylı analiz et
      const cardData = await page.evaluate(() => {
        const cards: any[] = [];
        
        // Tüm div elementlerini kontrol et
        const allDivs = document.querySelectorAll('div');
        allDivs.forEach(div => {
          const text = div.textContent || '';
          // Kart benzeri yapıları bul (başlık + sayı içeren)
          if (text.length > 10 && text.length < 300) {
            // Sayı içeriyor mu kontrol et
            const hasNumber = /\d/.test(text);
            if (hasNumber) {
              cards.push({
                text: text.trim(),
                html: div.innerHTML.substring(0, 1000),
                className: div.className,
              });
            }
          }
        });

        // Tüm span, p, h1-h6 elementlerini de kontrol et
        const textElements = document.querySelectorAll('span, p, h1, h2, h3, h4, h5, h6, td, th');
        textElements.forEach(el => {
          const text = el.textContent || '';
          if (text.length > 5 && text.length < 100 && /\d/.test(text)) {
            cards.push({
              text: text.trim(),
              html: el.innerHTML.substring(0, 200),
              className: el.className,
              tagName: el.tagName,
            });
          }
        });

        return cards;
      });

      console.log('📊 Bulunan kart sayısı:', cardData.length);
      
      // Kart verilerinden değerleri çıkar
      cardData.forEach((card, index) => {
        const text = card.text;
        // Her pattern için tüm varyasyonları dene
        Object.entries(patterns).forEach(([key, patternList]) => {
          if ((data as any)[key] === '0') {
            for (const pattern of patternList) {
              const match = text.match(pattern);
              if (match && match[1]) {
                (data as any)[key] = match[1].trim();
                console.log(`✅ ${key} kart ${index}'den bulundu:`, match[1].trim());
                return;
              }
            }
          }
        });
      });

      // Son çare: Tüm sayıları bul ve başlıklarla eşleştir
      if (Object.values(data).some(v => v === '0')) {
        const allNumbers = await page.evaluate(() => {
          const numbers: Array<{text: string, value: string, context: string}> = [];
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null
          );
          
          let node;
          while (node = walker.nextNode()) {
            const text = node.textContent?.trim() || '';
            const parent = node.parentElement;
            const parentText = parent?.textContent || '';
            
            // Sayı içeren metinleri bul
            const numberMatch = text.match(/([0-9,]+(?:\.[0-9]+)?)/);
            if (numberMatch && numberMatch[1]) {
              numbers.push({
                text: text,
                value: numberMatch[1],
                context: parentText.substring(0, 200),
              });
            }
          }
          
          return numbers;
        });

        console.log('🔢 Bulunan sayılar:', allNumbers.slice(0, 20));

        // Sayıları başlıklarla eşleştir
        Object.entries(patterns).forEach(([key, patternList]) => {
          if ((data as any)[key] === '0') {
            for (const numberInfo of allNumbers) {
              for (const pattern of patternList) {
                const match = numberInfo.context.match(pattern);
                if (match) {
                  (data as any)[key] = numberInfo.value.trim();
                  console.log(`✅ ${key} sayı eşleştirmesinden bulundu:`, numberInfo.value.trim());
                  break;
                }
              }
              if ((data as any)[key] !== '0') break;
            }
          }
        });
      }

      console.log('📊 Çekilen veriler:', data);

    } catch (error) {
      console.error('❌ Veri çekme hatası:', error);
    }

    await browser.close();

    data.lastUpdated = new Date().toISOString();

    console.log('✅ Dipos verileri çekildi:', data);

    return data;
  } catch (error: any) {
    console.error('❌ Dipos API hatası:', error);
    throw error;
  }
}

export async function GET() {
  // GET için varsayılan kullanıcı bilgileri
  try {
    const data = await fetchDiposData('felekkagan530', 'Hf354525');
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Veri çekilemedi',
        message: error.message,
        taslakProjeler: '0',
        onayBekleyenProje: '0',
        projeKontoru: '0',
        bugunReddedilenProje: '0',
        bugunOnaylananProje: '0',
        policeKontoru: '0',
        bugunkuRandevular: '0',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        {
          error: 'Kullanıcı adı ve şifre gerekli',
          taslakProjeler: '0',
          onayBekleyenProje: '0',
          projeKontoru: '0',
          bugunReddedilenProje: '0',
          bugunOnaylananProje: '0',
          policeKontoru: '0',
          bugunkuRandevular: '0',
        },
        { status: 400 }
      );
    }

    const data = await fetchDiposData(username, password);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ Dipos API hatası:', error);
    return NextResponse.json(
      {
        error: 'Veri çekilemedi',
        message: error.message,
        taslakProjeler: '0',
        onayBekleyenProje: '0',
        projeKontoru: '0',
        bugunReddedilenProje: '0',
        bugunOnaylananProje: '0',
        policeKontoru: '0',
        bugunkuRandevular: '0',
      },
      { status: 500 }
    );
  }
}
