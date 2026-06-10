const fs = require("fs");
const path = require("path");

const localizationDir = path.join(__dirname, "..", "Localization");

const translations = {
  english: {
    label: "Desktop icon scale",
    help: "Scales desktop shortcut icons and labels. 100% is the default size."
  },
  arabic: {
    label: "مقياس أيقونات سطح المكتب",
    help: "يغيّر حجم اختصارات سطح المكتب وتسمياتها. ‎100%‎ هو الحجم الافتراضي."
  },
  bulgarian: {
    label: "Мащаб на иконите на работния плот",
    help: "Променя размера на преките връзки и етикетите на работния плот. 100% е стандартният размер."
  },
  czech: {
    label: "Měřítko ikon na ploše",
    help: "Mění velikost zkratek na ploše a jejich popisků. 100 % je výchozí velikost."
  },
  danish: {
    label: "Skalering af skrivebordsikoner",
    help: "Skalerer genveje og etiketter på skrivebordet. 100 % er standardstørrelsen."
  },
  dutch: {
    label: "Schaal bureaubladpictogrammen",
    help: "Schaalt snelkoppelingen en labels op het bureaublad. 100% is de standaardgrootte."
  },
  finnish: {
    label: "Työpöydän kuvakkeiden skaala",
    help: "Skaalaa työpöydän pikakuvakkeita ja niiden tunnisteita. 100 % on oletuskoko."
  },
  french: {
    label: "Échelle des icônes du bureau",
    help: "Ajuste la taille des raccourcis et des libellés du bureau. 100 % est la taille par défaut."
  },
  german: {
    label: "Desktop-Symbolskalierung",
    help: "Skaliert Desktop-Verknüpfungen und Beschriftungen. 100 % ist die Standardgröße."
  },
  greek: {
    label: "Κλίμακα εικονιδίων επιφάνειας εργασίας",
    help: "Αλλάζει το μέγεθος συντομεύσεων επιφάνειας εργασίας και ετικετών. Το 100% είναι το προεπιλεγμένο μέγεθος."
  },
  hungarian: {
    label: "Asztali ikonok mérete",
    help: "Az asztali parancsikonok és felirataik méretét állítja. Az alapértelmezett méret 100%."
  },
  indonesian: {
    label: "Skala ikon desktop",
    help: "Mengubah ukuran pintasan desktop dan labelnya. 100% adalah ukuran bawaan."
  },
  italian: {
    label: "Scala icone desktop",
    help: "Ridimensiona le scorciatoie e le etichette del desktop. Il 100% è la dimensione predefinita."
  },
  japanese: {
    label: "デスクトップアイコンの拡大率",
    help: "デスクトップのショートカットアイコンとラベルのサイズを変更します。100%が標準サイズです。"
  },
  korean: {
    label: "바탕 화면 아이콘 크기",
    help: "바탕 화면 바로 가기 아이콘과 레이블 크기를 조절합니다. 100%가 기본 크기입니다."
  },
  norwegian: {
    label: "Skalering av skrivebordsikoner",
    help: "Skalerer snarveier og etiketter på skrivebordet. 100 % er standardstørrelsen."
  },
  polish: {
    label: "Skala ikon pulpitu",
    help: "Zmienia rozmiar skrótów na pulpicie i ich etykiet. 100% to rozmiar domyślny."
  },
  "portuguese-brazil": {
    label: "Escala dos ícones da área de trabalho",
    help: "Ajusta o tamanho dos atalhos e rótulos da área de trabalho. 100% é o tamanho padrão."
  },
  "portuguese-portugal": {
    label: "Escala dos ícones do ambiente de trabalho",
    help: "Ajusta o tamanho dos atalhos e rótulos do ambiente de trabalho. 100% é o tamanho predefinido."
  },
  romanian: {
    label: "Scara pictogramelor de pe desktop",
    help: "Scalează pictogramele de scurtătură și etichetele de pe desktop. 100% este dimensiunea implicită."
  },
  russian: {
    label: "Масштаб значков рабочего стола",
    help: "Изменяет размер ярлыков и подписей на рабочем столе. 100% — размер по умолчанию."
  },
  "simplified-chinese": {
    label: "桌面图标缩放",
    help: "缩放桌面快捷方式图标及其标签。100% 为默认大小。"
  },
  "spanish-latin-america": {
    label: "Escala de íconos del escritorio",
    help: "Ajusta el tamaño de los accesos directos y etiquetas del escritorio. El 100% es el tamaño predeterminado."
  },
  "spanish-spain": {
    label: "Escala de iconos del escritorio",
    help: "Ajusta el tamaño de los accesos directos y etiquetas del escritorio. El 100% es el tamaño predeterminado."
  },
  swedish: {
    label: "Skalning av skrivbordsikoner",
    help: "Skalar genvägar och etiketter på skrivbordet. 100 % är standardstorleken."
  },
  thai: {
    label: "ขนาดไอคอนบนเดสก์ท็อป",
    help: "ปรับขนาดทางลัดบนเดสก์ท็อปและป้ายชื่อ 100% คือขนาดเริ่มต้น"
  },
  "traditional-chinese": {
    label: "桌面圖示縮放",
    help: "縮放桌面捷徑圖示與標籤。100% 為預設大小。"
  },
  turkish: {
    label: "Masaüstü simge ölçeği",
    help: "Masaüstü kısayol simgelerinin ve etiketlerinin boyutunu ayarlar. %100 varsayılan boyuttur."
  },
  ukrainian: {
    label: "Масштаб значків робочого столу",
    help: "Змінює розмір ярликів і підписів на робочому столі. 100% — типовий розмір."
  },
  vietnamese: {
    label: "Tỷ lệ biểu tượng màn hình nền",
    help: "Thay đổi kích thước lối tắt và nhãn trên màn hình nền. 100% là kích thước mặc định."
  }
};

const keys = {
  label: "settings.web.desktop-icon-scale",
  help: "settings.help.web.desktop-icon-scale"
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
  map[keys.label] = pack.label;
  map[keys.help] = pack.help;
  const sortedKeys = Object.keys(map).sort();
  const sortedMap = {};
  for (let keyIndex = 0; keyIndex < sortedKeys.length; keyIndex++) {
    const sortedKey = sortedKeys[keyIndex];
    sortedMap[sortedKey] = map[sortedKey];
  }
  fs.writeFileSync(filePath, JSON.stringify(sortedMap, null, 2) + "\n", "utf8");
}

console.log("Updated desktop icon scale locales in " + files.length + " files.");
