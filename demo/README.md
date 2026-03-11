# Demo : Génération de GIFs avec Webdriver
## Prérequis
### Outils système
```bash
# Rust/Cargo (déjà requis pour le projet)
cargo install tauri-driver   # WebDriver pour Tauri
# Conversion video → GIF
sudo apt install ffmpeg   # Debian/Ubuntu
```

### Node.js
```bash
cd demo && npm install
```

## Utilisation
### Pipeline complet (build + record + convert)
```bash
cd demo
bash demo.sh
```

### Sauter le build (si le binaire release est déjà à jour)
```bash
bash demo.sh --skip-build
```

### Uniquement convertir les séquences d'images en gifs
```bash
bash demo.sh --gif-only
```

## Structure
```
demo/
├── package.json
├── wdio.conf.js              # configuration WebdriverIO + tauri-driver
├── scripts/
│   ├── record.sh             # build release → lance les tests
│   └── convert.sh            # PNG sequences → GIFs optimisés
└── tests/
    ├── walkthrough1.test.js  # premier lancement de l'app
    ├── walkthrough2.test.js  # saisie de texte + preview temps réel
    └── walkthrough3.test.js  # notepad : création et insertion de note
```

## Comment ça fonctionne
`demo.sh` va :
- Compiler le frontend (`npm run build`)
- Compiler le binaire Tauri en mode `release` (`cargo tauri build --no-bundle`), utile pour une application suffisamment optimisée et fluide
- Lancer Webdriver pour piloter l'app via les scripts de tests (demo)
- Assembler les PNG en GIF via `ffmpeg` et compresser avec `gifsicle`

## Ajouter un nouveau scénario
Un helper est disponible pour faciliter la création de scénarios de démonstration.
Pour ajouter une nouvelle démo :

- Créer un fichier `demo/tests/mon-scenario.test.js` en suivant le même pattern :
  ```javascript
  const { createRecorder, waitForEditor } = require("../helpers");
  
  const shot = createRecorder("mon-scenario");
  
  describe("Mon scénario", () => {
    it("montre une fonctionnalité", async () => {
      await waitForEditor();
  
      await shot("initial");
  
      // interactions
      const btn = await $("#mon-bouton");
      await btn.click();
      await browser.pause(300);
  
      await shot("resultat");
    });
  });
  ```

- Utiliser `waitForEditor()` pour attendre que l'application soit prête.
- Utiliser `shot("nom")` pour capturer les étapes importantes.
- Ajouter de petites pauses (`browser.pause(...)`) si une animation doit être visible.
- Lancer les démos pour générer les captures avec WebdriverIO.
