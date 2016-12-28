# elearn.js

Dies ist das Repository des elearn.js Projekts mit html-Template. elearn.js kann zur Produktion von digitalen Skripten für die Hochschullehre und Open Educational Ressources eingesetzt werden.

## Dokumentation

Eine umfassende Dokumentation des Projekts befindet sich unter http://www.sumo.uni-hamburg.de/DigitaleSkripte/.

> There is no English or international version so far.

## Versionen

### eLearn.js

* __0.9.8__ (WIP):
  * Fehlerbehebungen:
    * Darstellungsfehler bei einzelnen Icons behoben
    * Fehler in Touch- und Maussteuerungserkennung bei iOS behoben
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



### quiz.js

* __0.3.3__:
  * Neuerungen:
    * Darstellung der richtigen und falschen Antworten für Auswahlfragen
    verändert
  * Fehlerbehebungen:
    * Ursprüngliche HTML Form von Auswahlfragen ist zusätzlich zur neuen
    Variante wieder funktionsfähig
    * Fehler der Darstellung von Zielobjekten bei Quizaufgaben mit dem Typen
    Reihenfolge wurden behoben
    * Die Vorschrift der Strukturierung von Quizaufgaben wurde gelockert, um
    nicht funktionsfähige Aufgaben durch minimale Fehler im HTML Code zu
    vermeiden
* __0.3.2__:
  * Neuerungen:
    * Erstellung von Matrix- und Auswahlaufgaben vereinfacht
    * Leere Zielobjekte in Zuordnungsaufgaben möglich, wenn mindestens ein
    Objekt zugeordnet wurde
* __0.3.1__:
  * Neuerungen:
    * Mehrere richtige Antwortmöglichkeiten für Lückentext- und
    Zuordnungsaufgaben
  * Fehlerbehebungen:
    * Aufgaben mit zeitlicher Begrenzung werden gesperrt, wenn die Section die
    bestimmte Zeit aktiv war. Zuvor wurden die Zeiten nicht korrekt gestoppt.
* __0.3.0__:
  * Neuerungen:
    * Neue Fragetypen: Freitext, Lückentext, Fehlertext, Hotspot, Zuordnung,
    Reihenfolge, Matrix, Petrinetze, Zeichnung (Siehe Dokumentation)
    * Zeitliche Begrenzung von Fragen
    * Darstellung der Bildauswahlfragen verändert
    * Darstellung der richtigen und falschen Antworten bei Auswahlfragen
    angepasst
  * Fehlerbehebungen:
    * Wiederangezeigte Fragen per Referenz werden nicht mehr doppelt angezeigt
    * Auch veraltete Aufgaben werden korrekt blockiert, wenn gewollt
* __0.2.1__:
  * _Grundversion für das eLearn.js_


## Lizensierung

elearn.js ist eine Entwicklung des [eLearning-Büro MIN](https://www.min.uni-hamburg.de/studium/elearning.html) der Universität Hamburg.

Die Software steht unter der [MIT-Lizenz](http://opensource.org/licenses/mit-license.php).

Copyright (c) 2016 Michael Heinecke, eLearning-Büro MIN, Universität Hamburg
