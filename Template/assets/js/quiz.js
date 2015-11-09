/*
* v0.2.1 JavaScript Quiz - by Arne Westphal
* eLearning Buero MIN-Fakultaet - Universitaet Hamburg
*/

var correctQs = [];

/**
* Aktiviert alle <button> mit der Klasse "quizButton" für das Quiz.
* Wenn fragen <input> fokussiert ist, kann mit Enter die Antwort abgeschickt werden.
*/
$(document).ready(function() {
	init();
});


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
	
	$("#neustart").click(function() {
		resetQuiz();
	});
	
	resetQuiz();
}

/**
* Wird beim Bestätigen einer Antwort aufgeruffen.
* @param button - ist der geklickte Button von dem aus die beantwortete Frage
*                 bestimmt wird.
*/
function submitAns(button) {
    if($(button).filter(".weiter").length > 0) {
        button = $(button).prev(":button");
    }
	var div = $(button).prev('div.question');
	
	// Falls die Frage bereits beantwortet wurde, wird sie zurückgesetzt. (2. Button)
	if(div.is('.answered')) {
	    div.removeClass("answered");
	    div.find(".feedback").hide();
	    deleteLabelColoring(div.find("label"));
	    div.find("input:text").val("");
	    div.find("input:radio").prop("checked", false);
	    div.find("input:checkbox").prop("checked", false);
	    
        div.next("button.quizButton").show();
        div.nextUntil("div").filter("button.quizButton.weiter").hide();
	    correctQs[correctQs.length] = null;
	    return;
	}
    
	var c = getCorrectAnswers(div);
	
	var labels = div.children('.answers').children('label');
	deleteLabelColoring(labels);

	var type = labels.children('input').attr("type");

	var correct = true;

	if(type === "text") {
		correct = getCorrectForText(labels, c);
	}
	else if (type === "radio" || type === "checkbox") {
		correct = getCorrectForRadio(labels, c, true);
	}

	if(correct === -1) {
		deleteLabelColoring(labels);
		div.children("div.feedback").filter(".noselection").show();
		div.children("div.feedback").filter(".correct").hide();
		div.children("div.feedback").filter(".incorrect").hide();
		return;
	}
	else if(correct) {
		div.children("div.feedback").filter(".noselection").hide();
		div.children("div.feedback").filter(".correct").show();
		div.children("div.feedback").filter(".incorrect").hide();
	}
	else {
		div.children("div.feedback").filter(".noselection").hide();
		div.children("div.feedback").filter(".correct").hide();
		div.children("div.feedback").filter(".incorrect").show();
	}
	
	div.addClass("answered");
    div.next("button.quizButton").hide();
    div.nextUntil("div").filter("button.quizButton.weiter").show();
	correctQs[correctQs.length] = correct;
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
function getCorrectForRadio(labels, c, colorLabels) {
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
	if(numberofchecked === 0) {
		correct = -1;
	}
	return correct;
};


/**
* Gibt zurück, ob die eingegebene Antwort zu den korrekten gehört.
* -1 falls Textfeld leer.
*/
function getCorrectForText(labels, c) {
	var correct = true;
	var ans = labels.children('input').val();
	ans = encryptMD5(ans);
	if(!contains(c, ans)) {
		correct = false;
	}
	if(labels.children('input').val().length == 0) {
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
* Liest für ein <div> alle als korrekt angegebenen Antworten aus.
* Diese sollten MD5 Verschlüsselt sein.
*/
function getCorrectAnswers(div) {
	var c = [];
	div.children('a.ans').each(function(i) {
		c[c.length] = $(this).html();
	});
	return c;
};

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
}

/**
* Setzt alle Fragen des Quiz' auf den Anfangszustand zurück.
*/
function resetQuiz() {
	correctQs = [];
	$(".question").removeClass("answered");
	$(".feedback").hide();
	deleteLabelColoring($("label"));
	$("input:text").val("");
	$("input:radio").prop("checked", false);
	$("input:checkbox").prop("checked", false);
}
