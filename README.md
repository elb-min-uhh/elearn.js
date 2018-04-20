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
Das hier enthaltene Markdown-Template (unter
    [Examples/Markdown/elearn_template.md](/Examples/Markdown/elearn_template.md))
nutzt Funktionen, welche nur von diesem Package unterstützt werden.
Mit diesem Package erspart man sich viele sonst nötige Arbeitsschritte.

### Beispiele

Die Beispiele sind sehr hilfreich, wenn man auf ein Problem stößt oder gerade
erst anfängt mit elearn.js zu arbeiten. Sie sind zumeist darauf
ausgelegt im Quelltext betrachtet zu werden.

Dort gibt es aktuell Beispiele für die folgenden Fälle:
* __Markdown__: Beispiel für eine Markdown Datei die mit _atom-elearnjs_ einfach
    konvertierbar ist.
* __ResizingIFrame__: Beispiel für ein per IFrame eingebundenes _elearn.js_.
    Hier wird gezeigt, wie die Größe des IFrames automatisch an die Größe
    des _elearn.js_ angepasst werden kann.
* __TreeHierarchy__: Zeigt Beispiele verschachtelter Skripte. So kann man
    Inhalte einfach auf mehrere Skripte aufteilen, diese aber dennoch
    hierarchisch verlinken.

### Einstellungsmöglichkeiten

Im _elearn.js_ lassen sich einige Einstellungen tätigen. Diese sind
beispielhaft in der Datei [Template/index.html](/Template/index.html) gezeigt.
Im `<head>` befindet sich ein `<script>`, in welchem die Einstellungen in
auskommentierter Form vorliegen. Dort ist auch erklärt, wie diese eingebaut
werden können.

__Hinweis__: Bei der Nutzung von _atom-elearnjs_ lassen sich diese Einstellungen
wie in [Examples/Markdown/elearn_template.md](/Examples/Markdown/elearn_template.md)
durch den Tag `Custom` im _Meta Block_ einbinden. Weitere Informationen sind
in der Dokumentation des
[atom-elearnjs](https://github.com/elb-min-uhh/atom-elearnjs) zu finden.


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

Auch hier ist die einfachste Version ein Skript als Markdown Datei vorliegen
zu haben und dieses per _atom-elearnjs_ zu konvertieren. Hierbei erhält man
automatisch die aktuellste Version.

Um ein vorhandenes Skript manuell auf die neuste Version upzudaten ist etwas mehr
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

## Erweiterungen

Es existieren mehrere Erweiterungen für das _elearn.js_, welche aber auch
ohne dieses funktionieren:

* [quiz.js](https://github.com/elb-min-uhh/quiz.js) Einbettung von Quizelementen
* [elearnvideo.js](https://github.com/elb-min-uhh/elearnvideo.js) Videoelemente
    mit zusätzlichen Informationen und Notizen
* [clickimage.js](https://github.com/elb-min-uhh/clickimage.js) Interaktive
    Grafiken
* [timeslider.js](https://github.com/elb-min-uhh/timeslider.js) Interaktive
    Zeitleisten

## Versionen

Bitte sehen sie sich die Datei
[CHANGELOG.md](https://github.com/elb-min-uhh/elearn.js/blob/master/CHANGELOG.md)
an, um Informationen zu den Änderungen in den einzelnen Versionen zu erhalten.

## Lizensierung

elearn.js ist eine Entwicklung des [eLearning-Büro MIN](https://www.min.uni-hamburg.de/studium/elearning.html) der Universität Hamburg.

Die Software steht unter der [MIT-Lizenz](http://opensource.org/licenses/mit-license.php).

Copyright (c) 2016 Michael Heinecke, eLearning-Büro MIN, Universität Hamburg
