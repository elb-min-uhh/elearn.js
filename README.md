# elearn.js

Dies ist das Repository des elearn.js Projekts mit html-Template. elearn.js kann zur Produktion von digitalen Skripten für die Hochschullehre und Open Educational Ressources eingesetzt werden.

## Dokumentation

Eine umfassende Dokumentation des Projekts befindet sich unter http://www.sumo.uni-hamburg.de/DigitaleSkripte/.

> There is no English or international version so far.

## Empfehlung zur Verwendung

Es gibt für den Texteditor _Atom_ ein Package, welches ein einfaches
Konvertieren von Markdown zu elearn.js Ausgaben ermöglicht. Dieses bietet
sowohl eine HTML- als auch eine PDF-Ausgabe an. Weitere Informationen finden
Sie unter diesem Link https://github.com/elb-min-uhh/atom-elearnjs.
Das hier enthaltene Markdown-Template (unter `Template/elearn_template.md`)
nutzt Funktionen, welche nur von diesem Package unterstützt werden.
Mit diesem Package erspart man sich viele sonst nötige Arbeitsschritte.

## Manuelle Erstellung ohne _atom-elearnjs_

Sollten Sie das Package nicht nutzen wollen oder können, können Sie auch auf
andere Weise einen HTML Quelltext erzeugen und dort das elearn.js einbinden.
Um bei einem Versionsupdate keine Schwierigkeiten zu erhalten, sollten alle vom
Nutzer durchgeführten Änderungen in zusätzlichen Dateien umgesetzt werden.
Welche Dateien genau bei einem Update überschrieben werden, ist im
nachfolgenden Bereich zu erkennen.

Generell sollten besonders Veränderungen des Stils der Seite entweder direkt
in der _HTML_ Datei oder in einer neuangelegten _.CSS_ Datei geschehen.

### Vorhandenes Skript Updaten

Um ein vorhandenes Skript auf die neuste Version upzudaten ist nicht viel
Aufwand nötig. Hierzu sollte zunächst das Repository heruntergeladen werden.
Anschließend kopiert man den Ordner `Template/assets/` in das vorhandene Skript.
Dieser beinhaltet alle zwangsläufig notwendigen Dateien. Der darin enthaltene
Ordner `Template/assets/img/template-media` ist nicht notwendig, da er nur  
Dateien enthält, welche in dem Template verlinkt sind. Dieser kann also
nachträglich vollständig entfernt werden.

Sollten vom Nutzer Änderungen an diesen Dateien vorgenommen worden sein, werden
die Änderungen dabei natürlich überschrieben und sie müssten ggf. erneut
angewendet werden. Die HTML Seiten, welche die Skripte verwenden bleiben bei
diesem Vorgang natürlich unberührt.

## Versionen

_Hinweis:_ Erweiterungen zum eLearn.js, welche in diesem Repository enthalten
sind, haben jeweils eine eigene Versionsübersicht weiter unten.

### eLearn.js
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
    * Fehlerbehungen im Template
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

* __0.3.5__ (zu eLearn.js 1.0.0):
  * Neuerungen:
    * Das QuizJS ist als anonyme Funktion umgesetzt und somit voll
    automatisiert. Über Javascript ist keine Schnittstelle verfügbar, es wird
    alles über die Code-Ergänzungen in HTML umgesetzt
  * Fehlerbehebungen:
    * Für Sortieraufgaben wurde ein Fehler behoben, durch den nach Zurücksetzen
    der Frage keine Antworten mehr sichtbar waren
* __0.3.4__ (zu eLearn.js 0.9.9):
  * Neuerungen:
    * Button Stil selbstdefiniert, da abweichend von eLearn.js Stil (ab 0.9.9)
  * Fehlerbehebungen:
    * Fehler in der Darstellung von Klassifikations- und Sortieraufgaben behoben
* __0.3.3__ (zu eLearn.js 0.9.7):
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


### elearnvideo.js

* __0.3__ (zu eLearn.js 1.0.0):
  * Neuerungen:
    * Es wurden weitere Quelltextkommentare ergänzt, um alle Funktionen zu
    erklären
* __0.2__ (zu eLearn.js 0.9.9):
  * Neuerungen:
    * Bufferanimation
    * Videoplayerskalierung nicht mehr über JavaScript sondern CSS
    * Fehlermeldung, wenn Video nicht geladen werden kann
    * Unterstützung für Einbindung in OLAT. OLAT-Player wird dafür unterdrückt
    * Persönliche Notizen können auf Wunsch unter jedem Video ergänzt werden.
    Videos können dazu mit der Klasse "allow_user_notes" versehen werden
  * Fehlerbehebungen:
    * Zeitvorschau über Fortschrittsbalken jetzt korrekt
    * Wechsel zwischen Touch- und Maussteuerung jetzt funktionsfähig
    * Videosteuerung verbessert. Keine ungewollten Sprünge im Videofortschritt
    mehr
    * Keine Tastensteuerung zum Sectionwechsel möglich, wenn Video im
    Vollbildmodus abgespielt wird
* __0.1__ (zu eLearn.js 0.9.8):
  * Grundversion:
    * Eigener HTML5 Videoplayer (Mobile + Desktop)
    * Anmerkungen unter dem Video möglich (Durch Ersteller des Skripts)


## Lizensierung

elearn.js ist eine Entwicklung des [eLearning-Büro MIN](https://www.min.uni-hamburg.de/studium/elearning.html) der Universität Hamburg.

Die Software steht unter der [MIT-Lizenz](http://opensource.org/licenses/mit-license.php).

Copyright (c) 2016 Michael Heinecke, eLearning-Büro MIN, Universität Hamburg
