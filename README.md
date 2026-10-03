# Rottenberg-Monopoly

Monopoly über Rottenberg (Hösbach, Spessart) fürs Handy: bis zu 4 Spieler online oder reihum an einem Handy, Handy-Minigames, Dorfchat und Rangliste.

## Installieren
Link im Handy-Browser öffnen und dann:
- **iPhone (Safari):** Teilen-Symbol → „Zum Home-Bildschirm“
- **Android (Chrome):** Menü ⋮ → „App installieren“ bzw. „Zum Startbildschirm hinzufügen“

## Technik
- Reine Web-App (eine HTML-Datei), gehostet mit GitHub Pages.
- Online-Spiel über Firebase (anonyme Anmeldung + Firestore, Gratis-Tarif). Zugangsdaten in `firebase-config.js`, Sicherheitsregeln in `firestore.rules`.
- `fb-shim.js` bildet die Datenbank-Schnittstelle des Spiels auf Firestore ab.
- Ohne Firebase-Konfiguration funktioniert nur „Reihum spielen“.
