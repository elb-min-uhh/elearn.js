## Versionen

_Hinweis:_ Erweiterungen zum eLearn.js befinden sich in eigenen Repositories.

### eLearn.js
* __1.0.2__:
  * Fehlerbehebungen:
    * Schriftarten zusätzlich als _.ttf_ hinzugefügt
    * Fehlerbehebungen für CSS Flex Attribut (WebKit)
    * Tooltips werden auch bei schmalen Fenstern nicht mehr aus dem Bild
    geschoben
  * Anderes:
    * Das eLearn.js wurde grundlegend Refactored. Alle Funktionen müssen jetzt
    über das `eLearnJS` Objekt aufgerufen werden und sind nicht mehr global
    vorhanden
* __1.0.1__:
  * Neuerungen:
    * Markdown Template wurde angepasst für das `atom-elearnjs` package
    * MathJax Link erneuert
    * Druck Darstellung verbessert
  * Fehlerbehebungen:
    * Kachlübersicht wird auch in geschachtelter Form korrekt dargestellt
    * Das Event `ContentResize` wird auf dem window.parent nun bei allen
    Größenveränderungen korrekt gefeuert
* __1.0.0__:
  * Neuerungen:
    * Die Pfeile für die Sectionwechsel wurden neu positioniert und die
    klickbaren Bereiche umfassen nun die volle Fensterhöhe
    * Für Sectionwechsel, Berechnungen bei Fenstergrößenveränderungen,
    Touch-Maus-Wechsel, Tab-Wechsel (für Tabbed-Boxes) werden nun Events
    gesendet
      * alle Funktionen die Events senden sind mit _@event_ gekennzeichnet
      * alte _registerAfter..._ Funktionen werden weiterhin unterstützt, zählen
      aber als veraltet
  * Fehlerbehebungen:
    * Im Template wurde die MathJax-Verlinkung angepasst
* __0.9.9__:
  * Neuerungen:
    * Bildergallerien springen bei einem Loop nicht mehr, sondern behalten
    die Bewegungsrichtung bei
    * Stil der Kacheln im Inhaltsverzeichnis angepasst
    * Stil von Slider, Multiboxes und ausklappbaren Bereichen angepasst
  * Fehlerbehebungen:
    * Fehler der Bildergallerien behoben
    * Auswahl von Text durch mehrfaches Klicken auf bestimmte Buttons entfernt
* __0.9.8__:
  * Neuerungen:
    * Automatischer Übergang zwischen Touch- und Maussteuerung auch während
    der Nutzung
  * Fehlerbehebungen:
    * Darstellungsfehler bei einzelnen Icons behoben
    * Fehler in Touch- und Maussteuerungserkennung bei iOS behoben
    * Fehlerbehebungen im Template
* __0.9.7__:
  * Neuerungen:
    * Einzelne Sections werden automatisch in den Browserverlauf aufgenommen
  * Fehlerbehebungen:
    * Fehler der Darstellung von Bildergallerien wurde behoben
    * Fehler bei der Gestensteuerung zum Seitenwechsel wurde behoben
    * Fehler, welche zu nicht funktionsfähigen Multiboxes und
    Mouseover-Informationsblöcken führten, wurden behoben
* __0.9.6__:
  * Neuerungen:
    * Mouseover-Informationsblöcke wurden eingeführt
    * Sections können in Sub- und Subsubsections geschachtelt werden
  * Fehlerbehebungen:
    * Beim Wechsel von Sections werden auch eingebundene Audiodateien gestoppt
    * Berechnung der Breite der Navigationsleiste wieder korrekt (vorher zu
    kurz)
* __0.9.5__:
  * Neuerungen:
    * Gelesen-Haken in Kachelinhaltsverzeichnis per _.hide-read_ deaktivierbar
    * Pfeiltasten können zur Navigation gedrückt gehalten werden
    * Umstrukturierungen der Ordner
  * Fehlerbehebungen:
    * Navigationsleistenberechnung jetzt abhängig von beinhalteten Elementen
* __0.9.4__:
  * Neuerungen:
     * Multiboxes und ausklappbare Blöcke wurden eingeführt
* __0.9.3__:
  * Neuerungen:
    * Eine Section lässt sich durch ihren Namen öffnen per _showSection(NAME)_
* __0.9.2__:
  * Fehlerbehebungen:
    * Gestensteuerung zum Sectionwechsel verbessert
    * Bilder werden nicht zwangsläufig auf 100% gestreckt, sondern bekommen dies
    als Maximalbreite
* __0.9.1__:
  * Neuerungen:
    * Überschrift einstellbar für den Fall, dass keine bestimmte Section sondern
    alle sichtbar sind per _eLearnJS.setNavigationTitle("Überschrift")_
    * Kachelübersicht
    * Man kann Funktionen registrieren, die ausgeführt werden sollen, nachdem
    eine andere Section angezeigt wird
    * Backbutton wurde eingeführt
    * Bestimmte Section per Parameter im Link aufrufbar
  * Fehlerbehebungen:
    * Ausklappbare Übersicht der Navigationsleiste wird nicht mehr falsch
    positioniert
* __0.9__:
  * Neuerungen:
    * Beschreibung für Kacheln im Inhaltsverzeichnis möglich
  * Fehlerbehebungen:
    * Kacheldarstellung für Microsoft Edge und Firefox angepasst
* __0.8__:
  * Neuerungen:
    * Kacheldarstellung für das Inhaltsverzeichnis
    * Einstellungsmöglichkeiten: Fortschrittsbalken, Richtungspfeile,
    Tastatursteuerung deaktivierbar
* __0.7__:
  * Neuerungen:
    * Inhaltsverzeichnis zur Einbindung in den Text verfügbar
    * Aktive Section wird in Inhaltsübersicht hervorgehoben
    * Automatische Erkennung der Downloadmöglichkeit der Seite als _EPUB_ oder
    _PDF_
    * Menü kann nur noch per Button geöffnet werden
    * Umbenennung einzelner Menüpunkte
    * Videos stoppen beim Sectionwechsel
    * Tooltip für Gestensteuerung zum Sectionwechsel
  * Fehlerbehebungen:
    * Die Inhaltsübersicht der Navigationsleiste ist scrollbar, wenn sie zu
    lang ist
    * isTouchSupported korrekt funktionsfähig
    * Ein Fehler bei der Tastatursteuerung wurde behoben
    * Performanceverbesserung durch weniger Größenberechnungen
    * Kein Sectionwechsel wenn Element vertikal gescrollt werden sollte
* __0.6__:
  * Statische Elemente nicht mehr in der HTML Datei sondern Fest im JavaScript
  * Tooltips für Grundelemente des eLearn.js
  * Fehlerbehebungen
    * Fehler mit Klicken auf Touch-Devices behoben
* __0.5__:
  * _Zu früheren Versionen sind keine Informationen mehr verfügbar_
