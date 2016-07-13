/*
* quiz.js v0.2.1 - 15/12/04
* Ergänzend zum elearn.js v0.6
* JavaScript Quiz - by Arne Westphal
* eLearning Buero MIN-Fakultaet - Universitaet Hamburg
*/

var start_time = null;

/**
* Aktiviert alle <button> mit der Klasse "quizButton" für das Quiz.
* Wenn fragen <input> fokussiert ist, kann mit Enter die Antwort abgeschickt werden.
*/
$(document).ready(function() {
    init();

    // resize Funktion wird aufgerufen, wenn im eLearnJS eine neue section
    // angezeigt wird
    eLearnJS.registerAfterShow("quiz-resizing", windowResizing);
    eLearnJS.registerAfterShow("quiz-timer-init", initTimers);
});


// Quiztypen. Benennung entspricht dem, was im HTML Attribut qtype angegeben ist.
var quizTypes = {
    SHORT_TEXT : "short_text",
    CHOICE : "choice",
    FREE_TEXT : "free_text" ,
    FILL_BLANK : "fill_blank",
    FILL_BLANK_CHOICE : "fill_blank_choice",
    ERROR_TEXT : "error_text",
    HOTSPOT : "hotspot",
    CLASSIFICATION : "classification",
    ORDER : "order",
    MATRIX_CHOICE : "matrix_choice",
    PETRI : "petri"
};

var quizJS = this;


// ------------------------------------------------------------
// INTERFACE
// ------------------------------------------------------------

/**
* Gibt zurück, ob alle sichtbaren Fragen beantwortet wurden. (bool)
*/
function getVisibleQuestionsAnswered() {
    return $('.question:visible').filter('.answered').length
            == $('.question:visible').length;
}


// ------------------------------------------------------------



/**
* Diese Funktion initialisiert das Quiz.
*/
function init() {
    // Keine Tastaturnavigation
    keyAllowed = false;

    // Buttons hinzufügen
    $('div.question').after('<button class="quizButton">Lösen</button><button class="quizButton weiter">Zurücksetzen</button>');

    // Hide Feedbacks
    $("div.question").children("div.feedback").hide();

    // Add No Selection Feedback
    $("div.question").append('<div class="feedback noselection">Du musst diese Frage zuerst beantworten, bevor du lösen kannst.</div>');

    // Hide Weiter-Buttons
    $("button.weiter").hide();


    windowResizing();
    $(window).resize(function() {windowResizing()});

    shuffleAnswers();
    replaceRandoms();

    $(":button").filter(".quizButton").click(function() {
        submitAns(this);
    });

    // Submit with enter for every question possible
    $(".answers label").keyup(function(event) {
        if(event.which == 13) {
            $(this).closest("div.question").next(':button').click();
        }
    });


    // Fehlertext Buttons toggle
    $(".error_button").click(function() { toggleErrorButton(this); });

    $("#neustart").click(function() {
        resetQuiz();
    });

    addDragAndDropToClassification();
    addDragAndDropToOrderObjects();
    initiateHotspotImage();
    initiatePetriImage();

    resetQuiz();

    initTimers();
}

/**
* Wird beim Bestätigen einer Antwort aufgeruffen.
* @param button - ist der geklickte Button von dem aus die beantwortete Frage
*                 bestimmt wird.
*/
function submitAns(button, force) {
    if($(button).filter(".weiter").length > 0) {
        button = $(button).prev(":button");
    }
    var div = $(button).prev('div.question');

    // Falls die Frage bereits beantwortet wurde, wird sie zurückgesetzt. (2. Button)
    if(div.is('.answered')) {
        resetQuestion(div);
        return;
    }

    var c = getCorrectAnswers(div.find("a.ans"));

    var labels = div.children('.answers').children('label');
    deleteLabelColoring(labels);

    var type = div.attr("qtype");


    var correct = true;

    // Für alte Versionen oder nichtdefinierte Fragetypen
    if(type === undefined) {
        type = labels.children('input').attr("type");

        if(type === "text") {
            correct = getCorrectForText(labels, c);
        }
        else if (type === "radio" || type === "checkbox") {
            correct = getCorrectForRadio(labels, c, true);
        }
    }
    // Für explizit definierten qtype
    else {
        if(type === quizTypes.SHORT_TEXT) {
            correct = getCorrectForText(labels, c, force);
        }
        else if(type === quizTypes.CHOICE) {
            correct = getCorrectForRadio(labels, c, true, force);
        }
        else if(type === quizTypes.FREE_TEXT) {
            processFreeText(div);
        }
        else if(type === quizTypes.FILL_BLANK) {
            var answers = div.find("a.ans");
            correct = getCorrectFillBlank(labels, answers, force);
        }
        else if(type === quizTypes.FILL_BLANK_CHOICE) {
            var answers = div.find("a.ans");
            correct = getCorrectFillBlankChoice(labels, answers, force);
        }
        else if(type === quizTypes.ERROR_TEXT) {
            var buttons = div.find(".error_button");
            correct = getCorrectErrorText(buttons, c, force);
        }
        else if(type === quizTypes.CLASSIFICATION) {
            var dests = div.find(".destination");
            var answers = div.find("a.ans");
            correct = getCorrectClassification(dests, answers, force);
            if(correct !== -1) {
                div.find('.object').addClass("blocked");
            }
        }
        else if(type === quizTypes.ORDER) {
            var objects = div.find(".object").not(".destination");
            var answers = div.find("a.ans");
            correct = getCorrectOrder(objects, answers, force);
            div.find('.object').addClass("blocked");
        }
        else if(type === quizTypes.MATRIX_CHOICE) {
            var rows = div.find("tr");
            var answers = div.find("a.ans");
            correct = getCorrectMatrixChoice(rows, answers, force);
        }
        else if(type === quizTypes.HOTSPOT) {
            var hss = div.find('.hotspot');
            var gesucht = div.find('.gesucht').html();
            var answer = div.find('a.ans').filter('[id="'+gesucht+'"]');
            correct = getCorrectHotspot(div, hss, answer, force);
            hss.filter('.act').removeClass('act');
            if(correct !== -1 && correct !== true && correct !== 2) return;
        }
        else if(type === quizTypes.PETRI) {
            var places = div.find('.place');

            // after answer
            if(div.is('.show_feedback')) {
                div.removeClass("show_feedback");
                if(petriFinished(div)) {
                    blockPetri(div);
                    // for information show
                    correct = 2;
                }
                else {
                    petriNextPart(div);
                    places.filter('.act').removeClass('act');
                    return;
                }
            }
            // before answer - when answering
            else {
                var answers = div.find('a.ans').filter('[id="'+$('.petri_image').find('img:visible').attr("id")+'"]');
                correct = getCorrectPetri(div, places, answers, force);
                if(correct != -1) {
                    petriNextImage(div);
                    return;
                }
            }
        }
    }

    if(correct == -1 && force === true) {
        correct = false;
    }

    if(correct === -1) {
        deleteLabelColoring(labels);
        div.children("div.feedback").filter(".correct").hide();
        div.children("div.feedback").filter(".incorrect").hide();
        div.children("div.feedback").filter(".noselection").show();
        return;
    }
    else if(correct === true) {
        div.children("div.feedback").filter(".noselection").hide();
        div.children("div.feedback").filter(".incorrect").hide();
        div.children("div.feedback").filter(".correct").show();
    }
    else if(correct === false) {
        div.children("div.feedback").filter(".noselection").hide();
        div.children("div.feedback").filter(".correct").hide();
        div.children("div.feedback").filter(".incorrect").show();
    }
    // hide all (hotspot, petri when finished)
    else {
        div.children("div.feedback").filter(".noselection").hide();
        div.children("div.feedback").filter(".correct").hide();
        div.children("div.feedback").filter(".incorrect").hide();
        div.children("div.feedback").filter(".information").show();
    }

    div.addClass("answered");
    div.next("button.quizButton").hide();

    if(!div.is('.reset_blocked')) div.nextUntil("div").filter("button.quizButton.weiter").show();
};



/**
* Liest für ein <div> alle als korrekt angegebenen Antworten aus.
* Diese sollten MD5 Verschlüsselt sein.
*/
function getCorrectAnswers(ans) {
    var c = [];
    ans.each(function(i) {
        c[c.length] = $(this).html();
    });
    return c;
};


/**
* Gibt zurück, ob die Frage richtig beantwortet wurde bei einer Radio-Type-Frage.
* -1 Falls keine Antwort ausgewählt.
* @param labels      - alle labels die in der Frage vorkommen
* @param c           - alle korrekten Antworten. Ein Array, dass die aus <a class="ans></a> jeweiligen MD5 Verschlüsselten Antworten beinhaltet.
* @param colorLabels - true, Labels automatisch je nach korrektheit gefärbt werden sollen.
*                            Es werden alle Antworten die richtigen Antworten auf die Frage grün gefärbt.
*                            Fälschlicherweise angekreute Antworten werden rot markiert. Falsche und nicht angekreuzte Antworten bleiben weiß.
*/
function getCorrectForRadio(labels, c, colorLabels, force) {
    var correct = true;
    var numberofchecked = 0;
    labels.each(function(i) {
        var input = $(this).find('input');
        var correctAnswer = contains(c, encryptMD5(input.val()));

        if(input.is(':checked')) {
            numberofchecked++;
        }

        if(correctAnswer != input.is(':checked')) {
            correct = false;
        }

        if(colorLabels) {
            if(correctAnswer) {
                $(this).addClass('right');
            }
            else if(input.is(':checked')){
                $(this).addClass('wrong');
            }
        }
    });
    if(numberofchecked === 0 && !force) {
        correct = -1;
    }
    return correct;
};


/**
* Gibt zurück, ob die eingegebene Antwort zu den korrekten gehört.
* -1 falls Textfeld leer.
*/
function getCorrectForText(labels, c, force) {
    var correct = true;
    var ans = labels.children('input').val().trim();
    ans = encryptMD5(ans);
    if(!contains(c, ans)) {
        correct = false;
    }
    if(labels.children('input').val().length == 0 && !force) {
        correct = -1;
    }

    if(correct) {
        labels.addClass("right");
    }
    else {
        labels.addClass("wrong");
    }
    return correct;
};

/**
* Lücken Text mit Textfeldern
*
* -1 falls nicht alle ausgefüllt
*/
function getCorrectFillBlank(labels, answers, force) {
    var correct = true;

    labels.each(function(i, e) {
        var input = $(this).find("input");
        var id = input.attr("id");
        var cor = answers.filter("#"+id).text();
        var ans = encryptMD5(input.val().trim());

        // nicht ausgefüllt
        if(input.val().length == 0 && !force) {
            correct = -1;
            return false;
        }

        // antwort richtig
        if(cor == ans) {
            //$(this).addClass("right");
        }
        // antwort falsch
        else if(cor != ans) {
            correct = false;
            //$(this).addClass("wrong");
        }

        input.attr("disabled", true);
    });

    return correct;
}


/**
* Lücken Text mit Select
*
* kann nicht unbeantwortet sein
*/
function getCorrectFillBlankChoice(labels, answers, force) {
    var correct = true;

    labels.each(function(i, e) {
        var select = $(this).find("select");
        var id = select.attr("id");
        var cor = answers.filter("#"+id).text();
        var ans = encryptMD5(select.val());

        // antwort richtig
        if(cor == ans) {
            //$(this).addClass("right");
        }
        // antwort falsch
        else if(cor != ans) {
            correct = false;
            //$(this).addClass("wrong");
        }

        select.attr("disabled", true);
    });

    return correct;
}


/**
* Fehlertext. markierbare Wörter
*
* Kann nicht unausgefüllt sein
*/
function getCorrectErrorText(buttons, c, force) {
    var correct = true;

    buttons.each(function(i, e) {
        var ans = encryptMD5($(this).text());

        var act = $(this).is(".act");

        // Wort markiert und in Antworten enthalten
        if((contains(c, ans) && act)
            || (!contains(c, ans) && !act)) {
            // richtig
        }
        // Nicht markiert oder nicht in Antworten
        else if(!contains(c, ans) ^ !act) {
            // falsch
            correct = false;
        }
    });

    return correct;
}


/**
* Zuordnung
*
* -1 falls eines der Ziele nicht gefüllt
*/
function getCorrectClassification(dests, answers, force) {
    var correct = true;

    dests.each(function(i, e) {
        var dest = $(this);
        var id = dest.attr("id");
        var cor = answers.filter("#"+id).text();

        // leer
        if(dest.children().length == 0 && !force) {
            correct = -1;
            return false;
        }

        var ans = encryptMD5(dest.children().attr("id"));

        // antwort richtig
        if(cor == ans) {
            //$(this).addClass("right");
        }
        // antwort falsch
        else if(cor != ans) {
            correct = false;
            //$(this).addClass("wrong");
        }
    });

    return correct;
}


/**
* Reihenfolge
*
* Kann nicht unausgefüllt sein
*/
function getCorrectOrder(objects, answers, force) {
    var correct = true;
    var index = 0;

    objects.each(function(i, e) {
        var obj = $(this);
        var id = obj.children().attr("id");
        var cor = answers.filter("#"+id).text();

        // check if found object is in correct position
        // correct position is same or next active index

        // same position
        if(encryptMD5(""+index) == cor) {
        }
        // antwort richtig
        else if(encryptMD5(""+(index+1)) == cor) {
            index++;
        }
        // antwort falsch
        else {
            correct = false;
            //$(this).addClass("wrong");
        }
    });

    return correct;
}

/**
* Matrix (single/multiple) choice
*
* -1 wenn nicht in jeder Zeile mindest eines ausgewählt
*/
function getCorrectMatrixChoice(rows, answers, force) {
    var correct = true;

    rows.each(function(i, e) {
        var row = $(this);
        var id = row.attr("id");
        var cor = getCorrectAnswers(answers.filter("#"+id)); // Mehrere Antworten können vorhanden sein

        var inputs = row.find("input"); // alle Inputs der Zeile

        // keines ausgewählt in einer Zeile
        if(inputs.length > 0 && inputs.filter(':checked').length == 0
            && !force) {
            rows.find('input').attr("disabled", false);
            correct = -1;
            return false;
        }

        inputs.each(function(ii, ee) {
            var ans = $(rows.find(".antwort").get(ii)).attr("id");
            ans = encryptMD5(ans);

            // ausgewählt und richtig oder nicht ausgewählt und nicht richtig (insg richtig)
            if(($(ee).is(":checked") && contains(cor, ans))
                || (!$(ee).is(":checked") && !contains(cor, ans))) {

            }
            // falsch
            else {
                correct = false;
            }

            $(ee).attr("disabled", true);
        });
    });

    return correct;
}


function getCorrectHotspot(div, hss, answer, force) {
    var finished = false;

    // nichts ausgewählt
    if(hss.filter('.act').length == 0 && !force) {
        return -1;
    }
    else {
        var ans = hss.filter('.act').attr('id');
        ans = encryptMD5(ans);

        var correct = ans == answer.html();
        var cl = "cor";
        if(!correct) cl = "inc";

        hss.filter('.act').find('.descr').append("<div class='"+cl+"'>"
                                                    + div.find('.gesucht').html()
                                                    + "</div>");

        if(correct) {
            div.children("div.feedback").filter(".noselection").hide();
            div.children("div.feedback").filter(".incorrect").hide();
            div.children("div.feedback").filter(".correct").show();
        }
        else {
            div.children("div.feedback").filter(".noselection").hide();
            div.children("div.feedback").filter(".correct").hide();
            div.children("div.feedback").filter(".incorrect").show();
        }

        finished = !hotspotNextObject(div);

        if(finished) {
            blockHotspot(div);
            findCorrectsHotspot(div);
            // for information show
            finished = 2;
        }
    }
    return finished;
}


function getCorrectPetri(div, places, answers, force) {

    // nichts ausgewählt
    if(places.filter('.act').length == 0 && !force) {
        return -1;
    }
    else {
        correct = true;
        places.each(function(i,e) {
            var ans = $(this).attr('id');
            ans = encryptMD5(ans);

            c = getCorrectAnswers(answers);

            // markiert und richtig
            if(($(this).is(".act") && contains(c, ans))
                || (!$(this).is(".act") && !contains(c, ans))) {
            }
            else {
                correct = false;
                return false; // break;
            }
        });

        if(correct) {
            div.children("div.feedback").filter(".noselection").hide();
            div.children("div.feedback").filter(".incorrect").hide();
            div.children("div.feedback").filter(".correct").show();
        }
        else {
            div.children("div.feedback").filter(".noselection").hide();
            div.children("div.feedback").filter(".correct").hide();
            div.children("div.feedback").filter(".incorrect").show();
        }

        div.addClass("show_feedback");
    }
    return false;
}

// --------------------------------------------------------------------------------------
// PROCESS ANSWER
// --------------------------------------------------------------------------------------


function processFreeText(div) {
    div.find(".answers").find("textarea").attr('readonly','readonly');
}


// --------------------------------------------------------------------------------------


// --------------------------------------------------------------------------------------
// COPY QUESTION TO SHOW AGAIN
// --------------------------------------------------------------------------------------

/**
* Kopiert die Frage ohne Bestätigungsbuttons (reiner Fragekörper)
*/
function showQuestionHere(button) {
    var id = $(button).attr("id").replace("_ref", "");

    var orig = $('#'+id);

    var div = orig.clone();
    div.addClass("cloned");

    // zählt immer als beantwortet
    div.addClass("answered");

    // hinweis, dass nicht veränderbar
    div.find("h4").after(
        '<span class="answered_hint">Nicht änderbar, da die Frage bereits beantwortet wurde</span>');

    var type = orig.attr("qtype");
    // Verarbeiten der vorherigen Eingaben
    if(type === quizTypes.FREE_TEXT) {
        copyFreeText(div, orig);
    }
    else if(type === quizTypes.FILL_BLANK) {
        copyFillBlank(div, orig);
    }
    else if(type === quizTypes.FILL_BLANK_CHOICE) {
        copyFillBlankChoice(div, orig);
    }
    else if(type === quizTypes.HOTSPOT) {
        copyHotspot(div);
    }


    var hideButton = '<button class="free_text_ref" id="'+id+'_ref" onclick="removeQuestionHere(this)">Ausblenden</button>';
    $(button).before(div);
    $(button).before(hideButton)
    $(button).hide();
}

function removeQuestionHere(button) {
    $(button).prev().remove();
    $(button).next().show();
    $(button).remove();
}


function copyFreeText(div, orig) {
    div.find("textarea").val(orig.find("textarea").val());
    div.find("textarea").attr("readonly", "readonly");
}

function copyFillBlank(div, orig) {
    div.find("input").each(function(i, e) {
        // Kopiert ausgewählten Wert
        $(this).val($($(orig).find("input").get(i)).val());

        // Disabled jedes input
        $(this).attr("disabled", true);
    });
}

function copyFillBlankChoice(div, orig) {
    div.find("select").each(function(i, e) {
        // Kopiert ausgewählten Wert
        $(this).val($($(orig).find("select").get(i)).val());

        // Disabled jedes Select
        $(this).attr("disabled", true);
    });
}


function copyHotspot(div) {
    div.find('.hotspot').addClass("blocked");

    // hover funktionen
    div.find('.hotspot').mouseover(function(event) {
        if($(this).find('.descr').children().length > 0) $(this).find('.descr').show();
        calculateHotspotDescriptions($(this).closest('[qtype="'+quizTypes.HOTSPOT+'"]'));
    });
    div.find('.hotspot').mouseout(function(event) {
        $(this).find('.descr').hide();
    });
}


function finishQuestion(div) {
    var try_count = 50;
    while(!div.is(".answered") && try_count > 0) {
        submitAns(div.next('button'), true);
        try_count -= 1;
    }
}

function blockQuestion(div) {
    div.addClass("answered");

    var type = div.attr("qtype");

    if(type === quizTypes.FREE_TEXT) {
        div.find("textarea").attr("readonly", "readonly");
    }
    else if(type === quizTypes.SHORT_TEXT
            || type === quizTypes.CHOICE
            || type === quizTypes.FILL_BLANK
            || type === quizTypes.MATRIX_CHOICE) {
        // Disabled jedes input
        div.find("input").attr("disabled", true);
    }
    else if(type === quizTypes.FILL_BLANK_CHOICE) {
        div.find("select").attr("disabled", true);
    }
    else if(type === quizTypes.CLASSIFICATION
            || type === quizTypes.ORDER) {
        div.find('.object').addClass("blocked");
    }
    else if(type === quizTypes.HOTSPOT) {
        div.find('.hotspot').addClass("blocked");
    }
    else if(type === quizTypes.PETRI) {
        div.find('.place').addClass("blocked");
    }
}



// --------------------------------------------------------------------------------------
// DRAG AND DROP FUNCTIONS
// --------------------------------------------------------------------------------------




var draggedObjects = null;
var startedObject = null;

// CLASSIFICATION

/**
* Jedes Object kann gedragt und gedropt werden in jedem Object.
*/
function addDragAndDropToClassification() {
    var root = $('[qtype="'+quizTypes.CLASSIFICATION+'"]');
    root.find('.object').attr("draggable", "true");
    root.find('.object').on("dragstart", function(event) {
        dragObject(event.originalEvent);
    });
    root.find('.object').on("dragover", function(event) {
        allowObjectDrop(event.originalEvent);
    });
    root.find('.object').on("drop", function(event) {
        dropObject(event.originalEvent);
    });

    root.find('.object').on("dragend", function(event) {
        dragReset(event.originalEvent);
    });

    root.find('.object').on("dragenter", function(event) {
        draggedOver(event.originalEvent);
    });
    root.find('.object').on("dragleave", function(event) {
        draggedOut(event.originalEvent);
    });

    // mobile unterstützung / Klick-Fallback. Auch am Desktop möglich
    root.find('.object').on("click", function(event) {
        if(startedObject == null) {
            dragObject(event.originalEvent);
        }
        else {
            dropObject(event.originalEvent);
            dragReset(event.originalEvent);
        }
    });

}


// ORDER

function addDragAndDropToOrderObjects() {
    var root = $('[qtype="'+quizTypes.ORDER+'"]');
    root.find('.object').attr("draggable", "true");
    root.find('.object').on("dragstart", function(event) {
        dragObject(event.originalEvent);
    });

    root.find('.object').on("dragend", function(event) {
        dragReset(event.originalEvent);
    });


    // mobile unterstützung / Klick-Fallback. Auch am Desktop möglich
    root.find('.object').on("click", function(event) {
        if(startedObject == null) {
            dragObject(event.originalEvent);
        }
        else {
            dragReset(event.originalEvent);
        }
    });

    addDragAndDropToOrderDestinations(root);
}

function addDragAndDropToOrderDestinations(root) {
    root.find('.object').after(
        "<div class='object destination'></div>");

    root.find('.object').first().before(
        "<div class='object destination'></div>");
    root.find('.destination').on("dragover", function(event) {
        allowObjectDrop(event.originalEvent);
    });
    root.find('.destination').on("drop", function(event) {
        dropObject(event.originalEvent);
    });

    root.find('.destination').on("dragend", function(event) {
        dragReset(event.originalEvent);
    });

    root.find('.destination').on("dragenter", function(event) {
        draggedOver(event.originalEvent);
    });
    root.find('.destination').on("dragleave", function(event) {
        draggedOut(event.originalEvent);
    });

    // mobile unterstützung / Klick-Fallback. Auch am Desktop möglich
    root.find('.destination').on("click", function(event) {
        if(startedObject == null) {
        }
        else {
            dropObject(event.originalEvent);
            dragReset(event.originalEvent);
        }
    });
}


// DRAG & DROP --------------------------


/**
* Fügt dem Datentransfer alle zu verschiebenen Objekte hinzu
*/
function dragObject(e) {
    // get type
    var type = $(e.target).closest(".question").attr("qtype");

    // für firefox notwendig, sonst startet drag nicht
    if(event.type === "dragstart") e.dataTransfer.setData("transer", "data");

    if(type === quizTypes.CLASSIFICATION) {
        // Falls noch nicht benutzt
        if(!$(e.target).is(".used") && !$(e.target).is(".blocked")) {
            draggedObjects = $(e.target).children();
            startedObject = $(e.target);
            $(e.target).css("opacity", "0.4");
            $(e.target).css("background", "#888");
            $(e.target).closest(".answers").find(".destination").not(".full").addClass("emph");

            $(e.target).closest(".question").find(".object.used").each(function(i,e) {
                if($(this).children().attr("id") == draggedObjects.attr("id")) {
                    $(this).addClass("emph");
                }
            });
        }
        else {
            e.preventDefault();
        }
    }
    else if(type === quizTypes.ORDER) {
        if(!$(e.target).is(".blocked")) {
            startedObject = $(e.target);
            $(e.target).css("opacity", "0.4");
            $(e.target).css("background", "#888");
            setTimeout(function() {
                $(e.target).closest(".answers").find(".destination").addClass("vis");
                $(e.target).prev().removeClass("vis");
                $(e.target).next().removeClass("vis");
            }, 0);
        }
        else {
            e.preventDefault();
        }
    }

}


/**
* Verhindert Standardfunktionen
*/
function allowObjectDrop(e) {
    e.preventDefault();
}

/**
* Verschiebt alle Objekte in das Ziel
*/
function dropObject(e) {
    // get type
    var type = $(e.target).closest(".question").attr("qtype");

    if(type === quizTypes.CLASSIFICATION) {
        var dragBackToStart = draggedObjects.get(0).isEqualNode($(e.target).children().get(0));

        // Ablegen an freiem Platz aus StartObjekt (!= Zielobjekt)
        if(!startedObject.is(".destination")
                && $(e.target).is(".object.destination")
                && $(e.target).is(".object")
                && !$(e.target).is(".full")
                && !$(e.target).is(".blocked")) {
            e.preventDefault();
            startedObject.addClass("used");
            $(e.target).append(draggedObjects.clone());
            $(e.target).addClass("full");
            dragReset();
        }
        // Ablegen an freiem Platz aus Zielobjekt (verschieben)
        else if(startedObject.is(".destination")
                && $(e.target).is(".object.destination")
                && !$(e.target).is(".full")
                && !dragBackToStart
                && !$(e.target).is(".blocked")) {
            startedObject.removeClass("full");
            $(e.target).append(draggedObjects);
            $(e.target).addClass("full");
            dragReset();
        }
        // Zurücklegen an ursprünglichen Ort
        else if($(e.target).is(".object") && $(e.target).is(".used")
            && dragBackToStart
            && !$(e.target).is(".blocked")) {
            startedObject.removeClass("full");
            draggedObjects.remove();
            $(e.target).removeClass("used");
            dragReset();
        }
    }
    else if(type === quizTypes.ORDER) {
        $(e.target).after(startedObject);

        var root = $(e.target).closest(".question");
        root.find(".destination").remove();

        addDragAndDropToOrderDestinations(root);
        dragReset();
    }
}

/**
* Setzt Sachen zurück die während des Dragvorgangs verwendet werden.
*/
function dragReset(e) {
    // remove emphasis
    if(e != undefined) $(e.target).closest(".answers").find(".emph").removeClass("emph");

    $('.draggedover').removeClass("draggedover");
    $(".object").css("opacity", false);
    $(".object").css("background", false);
    $('.question[qtype="'+quizTypes.ORDER+'"]').find(".destination").removeClass("vis");
    draggedObjects = null;
    startedObject = null;
}

function draggedOver(e) {
    // Leer oder zurücklegen zur Ursprungsort
    if(!$(e.target).is(".full")
        || draggedObjects == $(e.target).children()) $(e.target).addClass("draggedover");
}

function draggedOut(e) {
    // Leer oder zurücklegen zur Ursprungsort
    if(!$(e.target).is(".full")
        || draggedObjects == $(e.target).children()) $(e.target).removeClass("draggedover");
}




// --------------------------------------------------------------------------------------
// HOTSPOT
// --------------------------------------------------------------------------------------

var activeElement = 0;

function initiateHotspotImage() {
    var root = $('[qtype="'+quizTypes.HOTSPOT+'"]');

    // Descr (richtige und falsche antworten) hinzufügen
    root.find('.hotspot').append('<div class="descr"></div>')

    // hover funktionen
    root.find('.hotspot').mouseover(function(event) {
        if($(this).find('.descr').children().length > 0) $(this).find('.descr').show();
        calculateHotspotDescriptions($(this).closest('[qtype="'+quizTypes.HOTSPOT+'"]'));
    });
    root.find('.hotspot').mouseout(function(event) {
        $(this).find('.descr').hide();
    });


    // Klicken auf Hotspot
    root.find('.hotspot').click(function() {
        hotspotClick($(this));
    });


    // zeigt erstes gesuchtes objekt in .gesucht an
    root.each(function(i,e) {
        hotspotNextObject($(e));
    });

    // berechnet Größe der Hotspots
    calculateHotspotDimensions();
}


function hotspotClick(hs) {
    if(!hs.is('.blocked')) {
        hs.closest('[qtype="'+quizTypes.HOTSPOT+'"]').find('.hotspot').removeClass("act");
        hs.addClass("act");
    }
}

/**
* Setzt in .gesucht das nächste Gesuchte Objekt ein
* gibt zurück ob ein nicht beantwortetes Objekt gefunden wurde (bool)
*/
function hotspotNextObject(root) {
    var doShuffle = root.find('.hotspot_image').is('.shuffle');

    var ans = root.find('a.ans').not('.used');
    if(doShuffle) {
        shuffle(ans);
    }

    root.find('.gesucht').html(ans.first().attr('id'));
    ans.first().addClass("used");

    return ans.length > 0;
}

function calculateHotspotDimensions() {
    var root = $('[qtype="'+quizTypes.HOTSPOT+'"]');

    root.each(function(i, e) {
        var imgWidth = root.find('.hotspot_image').width();
        var width = imgWidth * 0.05;

        $(e).find('.hotspot_image').find('.hotspot').css({
            "width" : width + "px",
            "height" : width + "px",
            "margin-top": "-" + (width/2) + "px",
            "margin-left": "-" + (width/2) + "px"
        });
    });
}

function calculateHotspotDescriptions(root) {
    const descr_margin = {
        top : 5,
        left : 0
    };

    root.each(function(i, e) {
        var imgWidth = root.find('.hotspot_image').width();
        var width = imgWidth * 0.05;


        var hs_img = $(e).find('.hotspot_image').find('img');

        var hss = $(e).find('.hotspot_image').find('.hotspot');

        hss.each(function(i,e) {
            hs = $(e);
            if(hs.find('.descr').length > 0) {
                var hs_width = hs.width();
                var des_width = hs.find('.descr').outerWidth();
                var des_height = hs.find('.descr').outerHeight();

                var top = (hs_width + descr_margin.top) + "px";
                var left = 0;

                // zu hoch um darunter angezeigt zu werden
                if((hs.offset().top
                    - hs_img.offset().top
                    + hs_width
                    + des_height
                    + descr_margin.top)
                    > hs_img.height()) {
                    top = "-" + (des_height + descr_margin.top) + "px";
                }

                // zu breit um nach rechts angezeigt zu werden
                if((hs.offset().left
                    - hs_img.offset().left
                    + hs_width
                    + des_width
                    + descr_margin.left)
                    > hs_img.width()) {
                    left = "-" + (des_width - hs_width - descr_margin.left) + "px";
                }

                hs.find('.descr').css({
                    "top" : top,
                    "left" : left
                });
            }
        });
    });
}

function blockHotspot(div) {
    div.find('.hotspot').addClass('blocked');
}


function findCorrectsHotspot(div) {
    var hss = div.find('.hotspot');
    var ans = div.find('a.ans');

    hss.each(function(i,e) {
        var hs = $(e);
        // bisher nicht korrekt
        if(hs.find('.cor').length == 0) {
            var id = hs.attr("id");
            var enc = encryptMD5(id);

            ans.each(function(ii, ee) {
                // korrekte antwort
                if($(ee).html() == enc) {
                    hs.find('.descr').prepend("<div class='cor'>"+$(ee).attr("id")+"</div>");
                }
            });
        }
    });
}



// ---------------------------------- PETRI IMAGE --------------------------------------

function initiatePetriImage() {
    var root = $('[qtype="'+quizTypes.PETRI+'"]');

    root.find('.petri_image').find('img').hide();
    root.find('.petri_image').find('img').first().show();

    root.find('.gesucht').html(root.find('.petri_image').find('img').first().attr("task"));

    // Klicken auf Hotspot
    root.find('.place').click(function() {
        petriClick($(this));
    });

    // berechnet Größe der Plätze
    calculatePetriDimensions();
}


function petriClick(element) {
    if(!element.is(".blocked")) {
        if(element.is(".act")) {
            element.removeClass("act");
        }
        else {
            element.addClass("act");
        }
    }
}

function petriNextImage(div) {
    var imgs = div.find('.petri_image').find('img');

    var act_img = div.find('.petri_image').find('img:visible');

    var idx = imgs.index(act_img);

    if(imgs.length > idx + 1) {
        next_img = $(div.find('.petri_image').find('img').get(idx+1));

        next_img.show();
        act_img.hide();
    }
}

function petriNextPart(div) {
    div.find('.gesucht').html(div.find('.petri_image').find('img:visible').attr("task"));
}

function petriFinished(div) {
    var finished = false;

    var act_img = div.find('.petri_image').find('img:visible');

    var idx = div.find('.petri_image').find('img').index(act_img);

    if(idx >= div.find('.petri_image').find('img').length - 1) {
        finished = true;
    }

    return finished;
}

function blockPetri(div) {
    div.find('.place').addClass("blocked");
}


function calculatePetriDimensions() {
    var root = $('[qtype="'+quizTypes.PETRI+'"]');

    root.each(function(i, e) {
        var imgWidth = root.find('.petri_image').width();
        var width = imgWidth * 0.05;

        $(e).find('.petri_image').find('.place').css({
            "width" : width + "px",
            "height" : width + "px",
            "margin-top": "-" + (width/2) + "px",
            "margin-left": "-" + (width/2) + "px"
        });
    });
}


// --------------------------------------------------------------------------------------

/**
* Streicht das Wort durch oder entfernt den Strich beim Draufklicken.
*/
function toggleErrorButton(button) {
    if(!$(button).parent().parent().is(".answered")) {
        if($(button).is(".act")) {
            $(button).removeClass("act");
        }
        else {
            $(button).addClass("act");
        }
    }

}


/**
* Entfernt für alle übergebenen Labels die färbenden Klassen "right" und "wrong"
*/
function deleteLabelColoring(labels) {
    labels.each(function() {
        $(this).removeClass('right');
        $(this).removeClass('wrong');
    });
};

/**
* Gibt zurück, ob val in dem array vorhanden ist.
* Es wird auch auf Typ-Gleichheit geprüft.
*/
function contains(array, val) {
    var found = false;
    for(var i=0; i<array.length; i++) {
        if(array[i] === val) {
            found = true;
        }
    }
    return found;
};


var timerAlertActivated = false;
var timerAlertText ="";

/**
* initialisiert Timer für alle Aufgaben die welche haben
*/
function initTimers() {
    start_time = new Date();

    // anzeigen der startzeit
    $('.question:visible').not('.answered').each(function(i,e) {
        var max_time = $(this).attr("max-time");
        if(max_time != undefined && max_time.length != 0) {
            max_time = parseInt(max_time);
            $(this).find('.answered_hint.timer').remove();
            $(this).find("h4").after("<div class='answered_hint timer'>"
                            + max_time + ":00</div>");
        }
    });

    updateTimers();
}

/**
* Aktualisieren aller Timer
*/
function updateTimers() {
    var now = new Date();
    var diff = (now.getTime() - start_time.getTime())/1000;

    $('.answered_hint.timer').each(function(i,e) {
        var timer = $(this);
        // time in seconds
        var time = parseInt(timer.closest('.question').attr("max-time")) * 60;
        var time_left = time - diff;

        if(timer.closest('.question').is('.answered')) return true;

        if(time_left > 0) {
            var min = Math.floor(time_left/60);
            var sec = Math.floor(time_left - min*60);
            if(sec < 10) {
                sec = "0" + sec;
            }
            $(this).html(min + ":" + sec);
        }
        else if(!$(this).closest(".question").is('.answered')) {
            finishQuestion($(this).closest(".question"));
            blockQuestion($(this).closest(".question"));
            $(this).closest(".question").find('.feedback.noselection').hide();

            $(this).closest(".question").append("<div class='feedback timeup'>Die Zeit ist abgelaufen. Die Frage wurde automatisch beantwortet und gesperrt.</div>");

            if(timerAlertActivated) {
                alert(timerAlertText);
            }
        }
    });

    setTimeout(function() { updateTimers(); }, 1000);
}

function setTimerAlert(bool, text) {
    timerAlertActivated = bool;
    timerAlertText = text;
}


/**
* Mischt die Antwortenreihenfolge bei dafür markierten Fragen.
*/
function shuffleAnswers() {
    $("div.answers").filter(".shuffle").each(function(i) {
        var labels = $(this).children("label");
        shuffle(labels);
        $(labels).remove();
        $(this).append($(labels));
        $(this).removeClass("shuffle");
    });
}

/**
* Ersetzt alle Inputs mit "rnd" als Value und %rnd im Text durch Werte aus dem vorgegebenem Wertebereich.
*/
function replaceRandoms() {
    $("div.answers").filter(".rnd").each(function(i) {
        var bereich = $(this).attr('class').replace("answers", "").replace("rnd","").replace("shuffle","").replace(/\s+/, "");
        var min = parseInt(bereich.split("-")[0]);
        var max = parseInt(bereich.split("-")[1]);
        var mul = parseInt(bereich.split("-")[2]);
        var inputs = $(this).children("label").children("input").filter(".rnd");
        var ohneZahlen = [];
        $(this).children("label").children("input").not(".rnd").each(function(j,c) {
            ohneZahlen[ohneZahlen.length] = parseInt($(c).val())/mul;
        });
        var randoms = zufallsArray(ohneZahlen, inputs.length, min, max);
        $(inputs).each(function(j, c) {
            $(this).removeClass("rnd");
            $(this).val(randoms[j]*mul);
            $(this).parent().html($(this).parent().html().replace("%rnd", randoms[j]*mul));
        });
        $(this).removeClass("rnd");
        $(this).removeClass(bereich);
    });
}

/**
    Gibt eine ganze Zufallszahl zwischen der unteren und oberen Grenze (beide enthalten) zurück.
*/
function randomInt(untereGrenze, obereGrenze) {
    var x = Math.floor((Math.random() * (obereGrenze-untereGrenze+1)) + untereGrenze);
    return x;
}

/**+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [v1.0] */
function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

/**
    Gibt ein Array zurück mit 'anzahl' Zufallszahlen zwischen untereG. und obereG. ohne die 'ohneZahl'
*/
function zufallsArray(ohneZahlen, anzahl, untereGrenze, obereGrenze) {
    var zufallArray = [];
    var x=0;
    do{
        x=randomInt(untereGrenze, obereGrenze);
        if($.inArray(x, zufallArray) == -1 && $.inArray(x, ohneZahlen) == -1) zufallArray[zufallArray.length] = x;
    } while(zufallArray.length < anzahl);
    return zufallArray;
}



/**
* Bricht die Antworten in neue Zeile unter das Bild, falls das Bild mehr als 60%
* der Breite einnimmt oder die Antworten mehr als 2 mal so hoch wie das Bild sind.
*/
function windowResizing() {
    $('div.question').each(function(e,i) {
        var maxWidth = 0;
        var maxHeight = 0;
        $(this).children('img').each(function() {
            maxWidth = Math.max(maxWidth, $(this).width());
            maxHeight = Math.max(maxHeight, $(this).outerHeight());
        });


        if(maxWidth*100/$('.question:visible').width() > 80 || $('.question:visible').children('div.answers').outerHeight() > 2*maxHeight) {
            $(this).children('img').css("float", "none");
            $(this).children('div.answers').css("padding-left", "0");
        }
        else {
            $(this).children('img').css("float", "left");
            $(this).children('div.answers').css("padding-left", maxWidth + "px");
        }
    });

    calculateHotspotDimensions();
    calculatePetriDimensions();
}



function resetQuestion(div) {
    div.removeClass("answered");
    div.find(".feedback").hide();
    deleteLabelColoring(div.find("label"));
    div.find("input:text").val("");
    div.find("input:radio").prop("checked", false);
    div.find("input:checkbox").prop("checked", false);

    div.find('textarea').attr('readonly', false);
    div.find('textarea').val("");
    div.find("select").attr("disabled", false);
    div.find("input").attr("disabled", false);

    // Zuordnung (Classfication)
    div.find('.used').removeClass("used");
    div.find('.full').children().remove();
    div.find('.full').removeClass("full");
    div.find('.blocked').removeClass("blocked");
    div.find('.act').removeClass("act");
    div.find('.hotspot').find('.descr').children().remove();
    div.find('.petri_image').find('img').hide();
    div.find('.petri_image').find('img').first().show();
    div.filter('[qtype="'+quizTypes.PETRI+'"]').find('.gesucht').html(div.find('.petri_image').find('img').first().attr("task"));

    div.nextAll("button.quizButton").first().show();
    div.nextAll("button.quizButton.weiter").first().hide();
}

/**
* Setzt alle Fragen des Quiz' auf den Anfangszustand zurück.
*/
function resetQuiz() {
    $(".question").removeClass("answered");
    $(".feedback").hide();
    deleteLabelColoring($("label"));
    $("input:text").val("");
    $("input:radio").prop("checked", false);
    $("input:checkbox").prop("checked", false);

    $('.question').find('textarea').attr('readonly', false);
}



/** *********************************************************************
*                                                                       *
*  MD5 Part                                                             *
*                                                                       *
* ******************************************************************** */

function encryptMD5(str) {
  //  discuss at: http://phpjs.org/functions/md5/
  // original by: Webtoolkit.info (http://www.webtoolkit.info/)
  // improved by: Michael White (http://getsprink.com)
  // improved by: Jack
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //    input by: Brett Zamir (http://brett-zamir.me)
  // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //  depends on: utf8_encode
  //   example 1: md5('Kevin van Zonneveld');
  //   returns 1: '6e658d4bfcb59cc13f96c14450ac40b9'

  var xl;

  var rotateLeft = function (lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  };

  var addUnsigned = function (lX, lY) {
    var lX4, lY4, lX8, lY8, lResult;
    lX8 = (lX & 0x80000000);
    lY8 = (lY & 0x80000000);
    lX4 = (lX & 0x40000000);
    lY4 = (lY & 0x40000000);
    lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
    if (lX4 & lY4) {
      return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
    }
    if (lX4 | lY4) {
      if (lResult & 0x40000000) {
        return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
      } else {
        return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
      }
    } else {
      return (lResult ^ lX8 ^ lY8);
    }
  };

  var _F = function (x, y, z) {
    return (x & y) | ((~x) & z);
  };
  var _G = function (x, y, z) {
    return (x & z) | (y & (~z));
  };
  var _H = function (x, y, z) {
    return (x ^ y ^ z);
  };
  var _I = function (x, y, z) {
    return (y ^ (x | (~z)));
  };

  var _FF = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(_F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  var _GG = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(_G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  var _HH = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(_H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  var _II = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(_I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  };

  var convertToWordArray = function (str) {
    var lWordCount;
    var lMessageLength = str.length;
    var lNumberOfWords_temp1 = lMessageLength + 8;
    var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    var lWordArray = new Array(lNumberOfWords - 1);
    var lBytePosition = 0;
    var lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  };

  var wordToHex = function (lValue) {
    var wordToHexValue = '',
      wordToHexValue_temp = '',
      lByte, lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      wordToHexValue_temp = '0' + lByte.toString(16);
      wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
    }
    return wordToHexValue;
  };

  var x = [],
    k, AA, BB, CC, DD, a, b, c, d, S11 = 7,
    S12 = 12,
    S13 = 17,
    S14 = 22,
    S21 = 5,
    S22 = 9,
    S23 = 14,
    S24 = 20,
    S31 = 4,
    S32 = 11,
    S33 = 16,
    S34 = 23,
    S41 = 6,
    S42 = 10,
    S43 = 15,
    S44 = 21;


  str = this.utf8_encode(str);
  x = convertToWordArray(str);
  a = 0x67452301;
  b = 0xEFCDAB89;
  c = 0x98BADCFE;
  d = 0x10325476;

  xl = x.length;
  for (k = 0; k < xl; k += 16) {
    AA = a;
    BB = b;
    CC = c;
    DD = d;
    a = _FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
    d = _FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
    c = _FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
    b = _FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
    a = _FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
    d = _FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
    c = _FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
    b = _FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
    a = _FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
    d = _FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
    c = _FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
    b = _FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
    a = _FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
    d = _FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
    c = _FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
    b = _FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
    a = _GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
    d = _GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
    c = _GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
    b = _GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
    a = _GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
    d = _GG(d, a, b, c, x[k + 10], S22, 0x2441453);
    c = _GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
    b = _GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
    a = _GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
    d = _GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
    c = _GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
    b = _GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
    a = _GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
    d = _GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
    c = _GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
    b = _GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
    a = _HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
    d = _HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
    c = _HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
    b = _HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
    a = _HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
    d = _HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
    c = _HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
    b = _HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
    a = _HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
    d = _HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
    c = _HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
    b = _HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
    a = _HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
    d = _HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
    c = _HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
    b = _HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
    a = _II(a, b, c, d, x[k + 0], S41, 0xF4292244);
    d = _II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
    c = _II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
    b = _II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
    a = _II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
    d = _II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
    c = _II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
    b = _II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
    a = _II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
    d = _II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
    c = _II(c, d, a, b, x[k + 6], S43, 0xA3014314);
    b = _II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
    a = _II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
    d = _II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
    c = _II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
    b = _II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  var temp = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);

  return temp.toLowerCase();
}

function utf8_encode(argString) {
  //  discuss at: http://phpjs.org/functions/utf8_encode/
  // original by: Webtoolkit.info (http://www.webtoolkit.info/)
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: sowberry
  // improved by: Jack
  // improved by: Yves Sucaet
  // improved by: kirilloid
  // bugfixed by: Onno Marsman
  // bugfixed by: Onno Marsman
  // bugfixed by: Ulrich
  // bugfixed by: Rafal Kukawski
  // bugfixed by: kirilloid
  //   example 1: utf8_encode('Kevin van Zonneveld');
  //   returns 1: 'Kevin van Zonneveld'

  if (argString === null || typeof argString === 'undefined') {
    return '';
  }

  var string = (argString + ''); // .replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  var utftext = '',
    start, end, stringl = 0;

  start = end = 0;
  stringl = string.length;
  for (var n = 0; n < stringl; n++) {
    var c1 = string.charCodeAt(n);
    var enc = null;

    if (c1 < 128) {
      end++;
    } else if (c1 > 127 && c1 < 2048) {
      enc = String.fromCharCode(
        (c1 >> 6) | 192, (c1 & 63) | 128
      );
    } else if ((c1 & 0xF800) != 0xD800) {
      enc = String.fromCharCode(
        (c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
      );
    } else { // surrogate pairs
      if ((c1 & 0xFC00) != 0xD800) {
        throw new RangeError('Unmatched trail surrogate at ' + n);
      }
      var c2 = string.charCodeAt(++n);
      if ((c2 & 0xFC00) != 0xDC00) {
        throw new RangeError('Unmatched lead surrogate at ' + (n - 1));
      }
      c1 = ((c1 & 0x3FF) << 10) + (c2 & 0x3FF) + 0x10000;
      enc = String.fromCharCode(
        (c1 >> 18) | 240, ((c1 >> 12) & 63) | 128, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
      );
    }
    if (enc !== null) {
      if (end > start) {
        utftext += string.slice(start, end);
      }
      utftext += enc;
      start = end = n + 1;
    }
  }

  if (end > start) {
    utftext += string.slice(start, stringl);
  }

  return utftext;
}
