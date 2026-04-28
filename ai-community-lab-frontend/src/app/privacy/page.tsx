export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-sm leading-6">
      <h1 className="text-2xl font-semibold mb-6">
        Adatkezelési Tájékoztató
      </h1>

      <p className="mb-6 text-zinc-400">
        Ez a szolgáltatás egy nem kereskedelmi, ingyenes közösségi projekt.
      </p>

      <h2 className="font-semibold mt-6 mb-2">1. Adatkezelő</h2>
      <p>
        Név: AICommunityLab (közösségi projekt)<br />
        Kapcsolat: aicommunitylab@gmail.com
      </p>

      <p className="mt-2 text-zinc-400">
        A projekt nem gazdasági társaság, nem végez kereskedelmi tevékenységet.
      </p>

      <h2 className="font-semibold mt-6 mb-2">2. Kezelt adatok köre</h2>
      <ul className="list-disc ml-6">
        <li>Google fiók azonosító (OAuth)</li>
        <li>E-mail cím (Google-től)</li>
        <li>Felhasználónév (ha megadod)</li>
        <li>Technikai adatok (IP, böngésző, session)</li>
      </ul>

      <h2 className="font-semibold mt-6 mb-2">3. Adatkezelés célja</h2>
      <ul className="list-disc ml-6">
        <li>Felhasználói fiók létrehozása</li>
        <li>Bejelentkezés biztosítása</li>
        <li>Közösségi funkciók működtetése</li>
        <li>Biztonság és visszaélések megelőzése</li>
      </ul>

      <h2 className="font-semibold mt-6 mb-2">4. Jogalap</h2>
      <ul className="list-disc ml-6">
        <li>GDPR 6. cikk (1) b) – szolgáltatás nyújtása</li>
        <li>GDPR 6. cikk (1) f) – jogos érdek (biztonság)</li>
      </ul>

      <h2 className="font-semibold mt-6 mb-2">5. Adatfeldolgozók</h2>
      <ul className="list-disc ml-6">
        <li>Supabase (EU – adatbázis és auth)</li>
        <li>Vercel (EU – hosting)</li>
        <li>Google (OAuth bejelentkezés)</li>
      </ul>

      <h2 className="font-semibold mt-6 mb-2">6. Adattárolás ideje</h2>
      <p>
        Az adatokat a fiók törléséig tároljuk. Törlés után az adatok véglegesen
        eltávolításra kerülnek.
      </p>

      <h2 className="font-semibold mt-6 mb-2">7. Érintetti jogok</h2>
      <ul className="list-disc ml-6">
        <li>Hozzáférés</li>
        <li>Helyesbítés</li>
        <li>Törlés</li>
        <li>Korlátozás</li>
        <li>Tiltakozás</li>
      </ul>

      <p className="mt-2">
        Jogérvényesítés: aicommunitylab@gmail.com
      </p>

      <h2 className="font-semibold mt-6 mb-2">8. Jogorvoslat</h2>
      <p>
        Panasz benyújtható a Nemzeti Adatvédelmi és Információszabadság
        Hatóságnál (NAIH).
      </p>

      <h2 className="font-semibold mt-6 mb-2">9. Cookie-k</h2>
      <p>
        A szolgáltatás kizárólag működéshez szükséges cookie-kat használ
        (pl. session, biztonsági tokenek).
      </p>

      <h2 className="font-semibold mt-6 mb-2">10. Adatbiztonság</h2>
      <p>
        Az alkalmazás technikai és szervezési intézkedésekkel védi az adatokat
        (HTTPS, hozzáférés-korlátozás, naplózás).
      </p>

      <h2 className="font-semibold mt-6 mb-2">11. Módosítás</h2>
      <p>
        A tájékoztató módosulhat. A változásokat ezen az oldalon tesszük közzé.
      </p>
    </main>
  );
}