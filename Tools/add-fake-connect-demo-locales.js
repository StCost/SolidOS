const fs = require("fs");
const path = require("path");

const localizationDir = path.join(__dirname, "..", "Localization");

const translations = {
  english: {
    title: "Interface Demo",
    message:
      "Thanks for exploring this standalone COLLAPSE MACHINE interface demo. This preview is menus and HUD only, not the open-world adventure. Wishlist the game on Steam to follow development and play the full experience on Emporia. Join Discord and our other channels below.",
    back: "Return to main menu"
  },
  arabic: {
    title: "عرض الواجهة",
    message:
      "شكرًا لتجربة عرض COLLAPSE MACHINE المستقل للواجهة. هذا المعاين للقوائم وواجهة اللعب فقط—وليس المغامرة المفتوحة. أضف اللعبة إلى قائمة الأمنيات على Steam لمتابعة التطوير ولعب التجربة الكاملة على Emporia. انضم إلى Discord وقنواتنا الأخرى أدناه.",
    back: "العودة إلى القائمة الرئيسية"
  },
  bulgarian: {
    title: "Демо на интерфейса",
    message:
      "Благодарим, че разгледахте самостоятелното демо на интерфейса на COLLAPSE MACHINE. Това е само преглед на менютата и HUD — не на отворения свят. Добавете играта в Steam wishlist, за да следите разработката и да изиграете пълното преживяване на Emporia. Присъединете се към Discord и другите ни канали по-долу.",
    back: "Обратно към главното меню"
  },
  czech: {
    title: "Ukázka rozhraní",
    message:
      "Děkujeme, že jste si prohlédli samostatnou ukázku rozhraní COLLAPSE MACHINE. Tato ukázka zobrazuje pouze menu a HUD — ne otevřený svět. Přidejte hru na Steam wishlist, sledujte vývoj a zahrajte si plný zážitek na Emporii. Připojte se k Discordu a dalším kanálům níže.",
    back: "Zpět do hlavního menu"
  },
  danish: {
    title: "Grænsefladedemo",
    message:
      "Tak fordi du udforskede denne selvstændige COLLAPSE MACHINE-grænsefladedemo. Forhåndsvisningen viser kun menuer og HUD — ikke det åbne verdenseventyr. Sæt spillet på Steam-ønskelisten for at følge udviklingen og spille den fulde oplevelse på Emporia. Deltag i Discord og vores andre kanaler nedenfor.",
    back: "Tilbage til hovedmenuen"
  },
  dutch: {
    title: "Interface-demo",
    message:
      "Bedankt voor het verkennen van deze standalone COLLAPSE MACHINE-interface-demo. Deze preview toont alleen menu's en HUD — niet het open-wereldavontuur. Zet de game op je Steam-verlanglijst om de ontwikkeling te volgen en de volledige ervaring op Emporia te spelen. Word lid van Discord en onze andere kanalen hieronder.",
    back: "Terug naar hoofdmenu"
  },
  finnish: {
    title: "Käyttöliittymädemo",
    message:
      "Kiitos, että tutustuit tähän erilliseen COLLAPSE MACHINE -käyttöliittymädemoon. Esikatselu näyttää vain valikot ja HUD:n — ei avointa maailmaseikkailua. Lisää peli Steam-toivelistalle seurataksesi kehitystä ja pelataksesi koko kokemuksen Emporialla. Liity Discordiin ja muihin kanaviimme alla.",
    back: "Takaisin päävalikkoon"
  },
  french: {
    title: "Démo d'interface",
    message:
      "Merci d'avoir exploré cette démo autonome de l'interface COLLAPSE MACHINE. Cet aperçu ne montre que les menus et le HUD — pas l'aventure en monde ouvert. Ajoutez le jeu à votre liste de souhaits Steam pour suivre le développement et vivre l'expérience complète sur Emporia. Rejoignez Discord et nos autres canaux ci-dessous.",
    back: "Retour au menu principal"
  },
  german: {
    title: "Interface-Demo",
    message:
      "Danke, dass du diese eigenständige COLLAPSE MACHINE-Interface-Demo erkundet hast. Diese Vorschau zeigt nur Menüs und HUD — nicht das Open-World-Abenteuer. Setze das Spiel auf deine Steam-Wunschliste, um die Entwicklung zu verfolgen und das volle Erlebnis auf Emporia zu spielen. Tritt Discord und unseren anderen Kanälen unten bei.",
    back: "Zurück zum Hauptmenü"
  },
  greek: {
    title: "Επίδειξη διεπαφής",
    message:
      "Ευχαριστούμε που εξερευνήσατε αυτή την αυτόνομη επίδειξη διεπαφής του COLLAPSE MACHINE. Η προεπισκόπηση δείχνει μόνο μενού και HUD — όχι την περιπέτεια ανοιχτού κόσμου. Προσθέστε το παιχνίδι στη λίστα επιθυμιών Steam για να ακολουθήσετε την ανάπτυξη και να παίξετε την πλήρη εμπειρία στην Emporia. Γίνετε μέλος στο Discord και στα άλλα κανάλια μας παρακάτω.",
    back: "Επιστροφή στο κύριο μενού"
  },
  hungarian: {
    title: "Felületi demó",
    message:
      "Köszönjük, hogy felfedezted ezt az önálló COLLAPSE MACHINE felületi demót. Ez az előnézet csak menüket és HUD-ot mutat — nem a nyílt világ kalandját. Tedd fel a játékot a Steam kívánságlistádra, kövesd a fejlesztést, és játszd végig a teljes élményt Emporián. Csatlakozz a Discordhoz és az alábbi csatornáinkhoz.",
    back: "Vissza a főmenübe"
  },
  indonesian: {
    title: "Demo Antarmuka",
    message:
      "Terima kasih telah menjelajahi demo antarmuka COLLAPSE MACHINE mandiri ini. Pratinjau ini hanya menampilkan menu dan HUD — bukan petualangan dunia terbuka. Tambahkan game ke wishlist Steam untuk mengikuti pengembangan dan memainkan pengalaman penuh di Emporia. Bergabunglah dengan Discord dan saluran kami di bawah.",
    back: "Kembali ke menu utama"
  },
  italian: {
    title: "Demo interfaccia",
    message:
      "Grazie per aver esplorato questa demo autonoma dell'interfaccia di COLLAPSE MACHINE. L'anteprima mostra solo menu e HUD — non l'avventura open world. Aggiungi il gioco alla wishlist Steam per seguire lo sviluppo e vivere l'esperienza completa su Emporia. Unisciti a Discord e agli altri canali qui sotto.",
    back: "Torna al menu principale"
  },
  japanese: {
    title: "インターフェース・デモ",
    message:
      "スタンドアロンの COLLAPSE MACHINE インターフェース・デモをお試しいただきありがとうございます。このプレビューはメニューと HUD のみで、オープンワールドの冒険そのものではありません。Steam のウィッシュリストに追加して開発をフォローし、Emporia でフル体験をプレイしてください。下の Discord ほか各チャンネルへご参加ください。",
    back: "メインメニューに戻る"
  },
  korean: {
    title: "인터페이스 데모",
    message:
      "독립 실행형 COLLAPSE MACHINE 인터페이스 데모를 둘러봐 주셔서 감사합니다. 이 미리보기는 메뉴와 HUD만 보여 주며 오픈 월드 모험은 아닙니다. Steam 위시리스트에 추가해 개발을 따라가고 Emporia에서 완전한 경험을 플레이하세요. 아래 Discord 및 다른 채널에 참여해 주세요.",
    back: "메인 메뉴로 돌아가기"
  },
  norwegian: {
    title: "Grensesnittdemo",
    message:
      "Takk for at du utforsket denne frittstående COLLAPSE MACHINE-grensesnittdemoen. Forhåndsvisningen viser bare menyer og HUD — ikke open world-eventyret. Legg spillet på Steam-ønskelisten for å følge utviklingen og spille den fulle opplevelsen på Emporia. Bli med på Discord og våre andre kanaler nedenfor.",
    back: "Tilbake til hovedmenyen"
  },
  polish: {
    title: "Demo interfejsu",
    message:
      "Dziękujemy za wypróbowanie samodzielnego demo interfejsu COLLAPSE MACHINE. Podgląd pokazuje tylko menu i HUD — nie przygodę w otwartym świecie. Dodaj grę do listy życzeń Steam, śledź rozwój i zagraj w pełne doświadczenie na Emporii. Dołącz do Discorda i naszych innych kanałów poniżej.",
    back: "Wróć do menu głównego"
  },
  "portuguese-brazil": {
    title: "Demo da interface",
    message:
      "Obrigado por explorar esta demo independente da interface de COLLAPSE MACHINE. A prévia mostra apenas menus e HUD — não a aventura em mundo aberto. Adicione o jogo à lista de desejos da Steam para acompanhar o desenvolvimento e jogar a experiência completa em Emporia. Entre no Discord e nos outros canais abaixo.",
    back: "Voltar ao menu principal"
  },
  "portuguese-portugal": {
    title: "Demonstração da interface",
    message:
      "Obrigado por explorar esta demonstração autónoma da interface COLLAPSE MACHINE. A pré-visualização mostra apenas menus e HUD — não a aventura em mundo aberto. Adicione o jogo à lista de desejos Steam para acompanhar o desenvolvimento e jogar a experiência completa em Emporia. Junte-se ao Discord e aos nossos outros canais abaixo.",
    back: "Voltar ao menu principal"
  },
  romanian: {
    title: "Demo interfață",
    message:
      "Îți mulțumim că ai explorat acest demo independent al interfeței COLLAPSE MACHINE. Previziunea arată doar meniuri și HUD — nu aventura din lumea deschisă. Adaugă jocul pe lista de dorințe Steam pentru a urmări dezvoltarea și a juca experiența completă pe Emporia. Alătură-te Discord și celorlalte canale de mai jos.",
    back: "Înapoi la meniul principal"
  },
  russian: {
    title: "Демо интерфейса",
    message:
      "Спасибо, что попробовали автономное демо интерфейса COLLAPSE MACHINE. Этот предпросмотр показывает только меню и HUD — не приключение в открытом мире. Добавьте игру в список желаемого Steam, следите за разработкой и сыграйте полную версию на Emporia. Присоединяйтесь к Discord и другим каналам ниже.",
    back: "Вернуться в главное меню"
  },
  "simplified-chinese": {
    title: "界面演示",
    message:
      "感谢你体验这款独立的 COLLAPSE MACHINE 界面演示。此预览仅包含菜单与 HUD，并非开放世界冒险本体。请将游戏加入 Steam 愿望单以关注开发进度，并在 Emporia 体验完整游戏。欢迎加入 Discord 及下方其他社群频道。",
    back: "返回主菜单"
  },
  "spanish-latin-america": {
    title: "Demo de interfaz",
    message:
      "Gracias por explorar esta demo independiente de la interfaz de COLLAPSE MACHINE. La vista previa muestra solo menús y HUD, no la aventura de mundo abierto. Añade el juego a tu lista de deseados de Steam para seguir el desarrollo y jugar la experiencia completa en Emporia. Únete a Discord y a nuestros otros canales abajo.",
    back: "Volver al menú principal"
  },
  "spanish-spain": {
    title: "Demo de interfaz",
    message:
      "Gracias por explorar esta demo independiente de la interfaz de COLLAPSE MACHINE. La vista previa muestra solo menús y HUD, no la aventura de mundo abierto. Añade el juego a tu lista de deseados de Steam para seguir el desarrollo y jugar la experiencia completa en Emporia. Únete a Discord y a nuestros otros canales abajo.",
    back: "Volver al menú principal"
  },
  swedish: {
    title: "Gränssnittsdemo",
    message:
      "Tack för att du utforskade denna fristående COLLAPSE MACHINE-gränssnittsdemo. Förhandsvisningen visar bara menyer och HUD — inte open world-äventyret. Lägg spelet på Steam-önskelistan för att följa utvecklingen och spela hela upplevelsen på Emporia. Gå med i Discord och våra andra kanaler nedan.",
    back: "Tillbaka till huvudmenyn"
  },
  thai: {
    title: "เดโมอินเทอร์เฟซ",
    message:
      "ขอบคุณที่ลองสำรวจเดโมอินเทอร์เฟซ COLLAPSE MACHINE แบบสแตนด์อโลนนี้ ตัวอย่างนี้แสดงเฉพาะเมนูและ HUD — ไม่ใช่การผจญภัยโลกเปิด ใส่เกมลงใน Steam Wishlist เพื่อติดตามการพัฒนาและเล่นประสบการณ์เต็มรูปแบบบน Emporia เข้าร่วม Discord และช่องทางอื่น ๆ ด้านล่าง",
    back: "กลับไปเมนูหลัก"
  },
  "traditional-chinese": {
    title: "介面示範",
    message:
      "感謝你體驗這款獨立的 COLLAPSE MACHINE 介面示範。此預覽僅包含選單與 HUD，並非開放世界冒險本體。請將遊戲加入 Steam 願望清單以關注開發進度，並在 Emporia 體驗完整遊戲。歡迎加入 Discord 及下方其他社群頻道。",
    back: "返回主選單"
  },
  turkish: {
    title: "Arayüz Demosu",
    message:
      "Bu bağımsız COLLAPSE MACHINE arayüz demosunu keşfettiğiniz için teşekkürler. Önizleme yalnızca menüleri ve HUD'u gösterir — açık dünya macerasını değil. Gelişmeyi takip etmek ve Emporia'da tam deneyimi oynamak için oyunu Steam istek listenize ekleyin. Aşağıdaki Discord ve diğer kanallarımıza katılın.",
    back: "Ana menüye dön"
  },
  ukrainian: {
    title: "Демо інтерфейсу",
    message:
      "Дякуємо, що спробували автономне демо інтерфейсу COLLAPSE MACHINE. Цей перегляд показує лише меню та HUD — не пригоду у відкритому світі. Додайте гру до списку бажаного Steam, стежте за розробкою та зіграйте повний досвід на Emporia. Приєднуйтесь до Discord та інших каналів нижче.",
    back: "Повернутися до головного меню"
  },
  vietnamese: {
    title: "Bản demo giao diện",
    message:
      "Cảm ơn bạn đã khám phá bản demo giao diện COLLAPSE MACHINE độc lập này. Bản xem trước chỉ hiển thị menu và HUD — không phải cuộc phiêu lưu thế giới mở. Thêm game vào Steam Wishlist để theo dõi phát triển và chơi trải nghiệm đầy đủ trên Emporia. Tham gia Discord và các kênh khác bên dưới.",
    back: "Quay lại menu chính"
  }
};

const keys = {
  title: "web.fake-connect.demo.title",
  message: "web.fake-connect.demo.message",
  back: "web.fake-connect.demo.back"
};

const files = fs.readdirSync(localizationDir).filter(function (name) {
  return name.endsWith(".json") && name !== "languages.json" && !name.startsWith("_");
});

const englishFallback = translations.english;

for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
  const fileName = files[fileIndex];
  const languageCode = fileName.replace(/\.json$/, "");
  const filePath = path.join(localizationDir, fileName);
  const map = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const pack = translations[languageCode] || englishFallback;
  map[keys.title] = pack.title;
  map[keys.message] = pack.message;
  map[keys.back] = pack.back;
  const sortedKeys = Object.keys(map).sort();
  const sortedMap = {};
  for (let keyIndex = 0; keyIndex < sortedKeys.length; keyIndex++) {
    const sortedKey = sortedKeys[keyIndex];
    sortedMap[sortedKey] = map[sortedKey];
  }
  fs.writeFileSync(filePath, JSON.stringify(sortedMap, null, 2) + "\n", "utf8");
}

console.log("Updated " + files.length + " locale files.");
