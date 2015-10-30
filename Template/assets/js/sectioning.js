/*
* v0.4 JavaScript SectionSort - by Arne Westphal
* eLearning Buero MIN-Fakultaet - Universitaet Hamburg
* touch-script base by PADILICIOUS.COM and MACOSXAUTOMATION.COM
*/

var visSection = 0;
var allShown = false;
var overviewShown = false;
var navigationTitle = "";



// --------------------------------------------------------------------------------------
// Initialisierungsfunktion
// --------------------------------------------------------------------------------------

$(document).ready(function() {
    initiateSections();
    showAllSections();
    initiateSideMenu();
    initiateTooltips();
    
    $('#qrcode').qrcode({
        "width": 256,
        "height": 256,
        "text": window.location.href
    });
    $('#qr_overlay').click(function() {$('#qr_overlay').hide();});
    
    initiateGalleries();
});

/**
* Erstellt die einfachen Buttons, die das Vor- und Zurückgehen sowie das Anzeigen
* aller Sections ermöglichen
*/
function initiateSections() {
	$('#progressbar').css('width', 100/$('section').length + "%");
	navigationTitle = $('#nav-title').text();
	addTouchToSections();
	createSectionOverview();
	$('.section-overview').css('top', $('#navigation').height() + "px");
	//$('#sideMenu').css('max-width', Math.min($('#sideMenu').width(), $(document).width()) + "px");
};

/**
* Erstellt das SideMenu
*/
function initiateSideMenu() {
    $('.menu-wrap').html('<div class="side-menu" id="sideMenu">'
    					+ '<div><table>'
							+ '<tr class="side-menu-element" onclick="javascript: window.print();">'
								+ '<td class="side-menu-icon"><div class="icon-print"></div></td> '
								+ '<td class="side-menu-content"><div>Drucken</div></td>'
							+ '</tr>'
							+ '<tr class="side-menu-element" onclick="javascript: $(\'#qr_overlay\').show();">'
								+ '<td class="side-menu-icon"><div class="icon-share"></div></td> '
								+ '<td class="side-menu-content">Teilen</td>'
							+ '</tr>'
							+ '<tr class="side-menu-element" onclick="javascript: openInfo();">'
								+ '<td class="side-menu-icon"><div class="icon-info"></div></td> '
								+ '<td class="side-menu-content">Info</td>'
							+ '</tr>'
    					+ '</table></div>'
    					+ '</div>');
    $('#sideMenu').css('right', "-"+($('#sideMenu').width()+10)+"px");
}

/**
* Zeigt die vorherige Section
* Funktioniert nur, wenn nicht alle Sections angezeigt werden.
*/
function showPrev() {
	showSection(visSection-1);
};

/**
* Zeigt die nächste Section
* Funktioniert nur, wenn nicht alle Sections angezeigt werden.
*/
function showNext() {
	showSection(visSection+1);
};

/**
* Zeigt eine bestimmte Section (nach Index)
* Funktioniert nur, wenn nicht alle Sections angezeigt werden.
*/
function showSection(i) {
	overviewShown = true;
	showSectionOverview();
	if(!allShown && i >= 0 && i < $('section').length) {
		$('section').hide();
		
		$($('section')[i]).show();
		
		var topPos = $($('section')[i]).position().top - $('#navigation').height() - 10;
		if($(document).scrollTop() > topPos) {
			$(document).scrollTop(topPos);
		}
		
		$('#nav-title').text($($('section')[i]).attr('name'));
		
		visSection = i;
		allShown = false;
		calcProgress(i);
		
		resizeAllSliders();
	}
	else if(allShown) {
		var topPos = $($('section')[i]).position().top - $('#navigation').height() - 10;
		$(document).scrollTop(topPos);
		
		resizeAllSliders();
	}

    if(!allShown) {
		setDirectionButtonsEnabledIdx(visSection);
    }
};

/**
* Aktualisiert den Fortschritt der progressbar
*/
function calcProgress(i) {
	var p = ((i)*100)/($('section').length);
	$('#progressbar').css('left', p + "%");
};

/**
* Schaltet zwischen alle Sections anzeigen und nur eine um.
*/
function showAllSections() {
	setDirectionButtonsEnabled(allShown);
	setProgressbarEnabled(allShown);
	$('#nav-title').text(navigationTitle);
	
	if(allShown) {		
		allShown = false;
		showSection(visSection);
	}
	else {	
		$('section').show();
		allShown = true;
        resizeAllSliders();
	}
};

/**
* Aktiviert die Frage vor und zurück Buttons wenn b == true. deaktiviert sie sonst.
*/
function setDirectionButtonsEnabled(b) {
	if(b) {
		$('#btnPrev').show();
		$('#btnNext').show();
	}
	else {
		$('#btnPrev').hide();
		$('#btnNext').hide();
	}
};

/**
* Aktiviert die Frage vor und zurück Buttons je nach Index.
*/
function setDirectionButtonsEnabledIdx(i) {
	$('#btnPrev').show();
	$('#btnNext').show();
	if(i == 0 || overviewShown) {
		$('#btnPrev').hide();
	}
	if(i == ($('section').length - 1) || overviewShown) {
		$('#btnNext').hide();
	}
}

/**
* Aktiviert die Progressbar wenn b == true. deaktiviert sie sonst.
*/
function setProgressbarEnabled(b) {
	if(b) {
		$('#progressback').show();
		$('.menu-wrap').css('top', $('#navigation').height() + "px");
		$('.section-overview').css('top', $('#navigation').height() + "px");
	}
	else {
		$('#progressback').hide();
		$('.menu-wrap').css('top', $('#navigation').height() + "px");
		$('.section-overview').css('top', $('#navigation').height() + "px");
	}
};



// -------------------------------------------------------------------------------------
// Overview
// -------------------------------------------------------------------------------------

var justOpenedOverview = false;
/**
* Erstellt ein Inhaltsverzeichnis.
*/
function createSectionOverview() {
	var text = "<div>";
	
	for(var i=0; i<$('section').length; i++) {
		text += "<label><div class='section-overview-element btn' onclick='showSection("+i+")'>"
					+ $($('section')[i]).attr('name') 
				+"</div></label>";
	}
    text+="</div>";
	
	$('.section-overview').html(text);
}


/**
* Zeigt oder versteckt die Kapitelübersicht aus der Navigationsleiste.
* Wird bei einem klick auf das jeweilige Symbol ausgeführt.
*/
function showSectionOverview() {
	overviewShown = !overviewShown;
	if(!overviewShown) {
		$('.section-overview').hide();
		$('#btnExp').removeClass("mirrorY");
		if(!allShown) {
		    setDirectionButtonsEnabledIdx(visSection);
		}
		else {
		    setDirectionButtonsEnabled(false);
		}
	}
	else {
		justOpenedOverview = true;
		$('.section-overview').show();
		$('#btnExp').addClass("mirrorY");
		setDirectionButtonsEnabled(false);
	}
}

/**
* Bei einem Klick neben die Elemente Kapitelübersicht, Side-Menu, Lightbox (für 
* info) werden diese wieder geschlossen.
*/
$(document).on("click", function(e){
	if(!$(e.target).is(".section-overview *")
		&& !$(e.target).is("#btnExp")
		&& overviewShown) {
		showSectionOverview();
	}
	if(!$(e.target).is("#sideMenu")
		&& !$(e.target).is("#sideMenu *")
		&& !$(e.target).is("#btnMenu")
		&& isSideMenuVisible()) {
		toggleSideMenu();
	}
    if(!$(e.target).is(".lb-wrap *")
		&& !$(e.target).is("#sideMenu *")) {
        $('.lb-wrap').hide();
    }
});


// --------------------------------------------------------------------------------------
// Side Menu
// --------------------------------------------------------------------------------------

/**
* Öffnet und Schließt das Menü an der rechten Seite
*/
function toggleSideMenu(isVisible) {
    //if(isVisible) return;
	$('.menu-wrap').css('top', $('#navigation').height() + "px"); 
	if (isSideMenuVisible()) {
		$('#sideMenu').animate({
			right: "-="+($('#sideMenu').width()+10),
			}, 200, 
			function() {
		});
	}
	else {
		$('#sideMenu').animate({
			right: "0",
			}, 200, 
			function() {
		});
	}
}

/**
* Gibt zurück ob das Menü sichtbar ist. 
* true = sichtbar
*/
function isSideMenuVisible() {
	return ($('#sideMenu').css('right') == (0 + "px"));
}

/**
* Zeigt die Info-Lightbox an, welche die ID "info" hat.
*/
function openInfo() {
    $('#info').show();
    $('#sideMenu').animate({
        right: "-="+($('#sideMenu').width()+10),
        }, 200, 
        function() {
    });
}



// --------------------------------------------------------------------------------------
// Slider Part. Initialization and functions to interact.
// Touch part is integretated in the older touch functions.
// --------------------------------------------------------------------------------------

/**
* Die Index Nummer des Arrays entspricht der Nummer des Sliders (zB Slider 0 =
* der oberste Slider im Quelltext)
* An dem Index steht dann welches Bild aktuell sichtbar ist.
*/ 
var visibleImage = [];


/**
* Initialisiert alle Slider
* Fügt Buttons hinzu. Stellt die Größe richtig ein...
*/
function initiateGalleries() {
    // Container für Zoom-Funktion
	$('body').prepend('<div class="image-zoom-container">'
    					+ '<div class="lb-bg" onclick="closeZoom(this);"></div>'
    					+ '<div class="img-lightbox">'
    						+ '<div class="close btn" onclick="closeZoom($(this).parent());">x</div>'
    					+ '</div>'
    				+ '</div>');
    $('.slider').wrap("<div class='slider-con'></div>");
    $('.slider').each(function() {
        visibleImage[visibleImage.length] = 0;
    	if($(this).filter('.preview-nav').length > 0) {
    		initiateSliderPreview($(this).parent());
    	}
        var ul = $($(this).children('ul.img-gallery')[0]);
        $(this).after('<div class="slider-back-area btn" onclick="goLeft(this);">'
    					+ '<div class="icon-back slider-back btn"></div>'
    				+ '</div>'
    				+ '<div class="slider-next-area btn" onclick="goRight(this);">'
    					+ '<div class="icon-next slider-next btn"></div>'
    				+ '</div>'
    				+ '<div class="slider-zoom-area btn" onclick="zoomImage(this);">'
    					+ '<div class="icon-zoom slider-zoom btn"></div>'
    				+ '</div>');
        ul.children('li').prepend("<span class='helper'></span>");
        showSlideButtons(ul, 0, false);
        
        if(ul.not('.fixed-size').length > 0) {
            getImageSize($(ul.children('li')[0]).children("img"), function(width, height){
                ul.parent().css("height", height + "px");
            });
        }
		$(this).parent().after("<div class='slider-description'></div>");
        showSlideDescription(ul, 0);
    });
    resizeAllSliders();
}

/**
* Erstellt eine SliderPreview, wenn ein Slider (übergebenes div) die 
* Klasse "preview-nav" hat.
*/
function initiateSliderPreview(div) {
	var fullWidth = div.width();
	var liWidth = fullWidth / 4.5;
	var liHeight = fullWidth / 6.0;
	div.after("<div class='slider-nav'></div>");
	var sliderNav = div.next('.slider-nav');
	sliderNav.wrap('<div class="preview-con"></div>');
	sliderNav.html(div.children(".slider").html());
	var ul = sliderNav.children('ul.img-gallery');
	ul.children('li').each(function() {
		var li = $(this);
        li.prepend("<span class='helper'></span>");
		$(this).click(function() {
			var idx = $(this).parent().children('li').index($(this));
			showSlide($(this).parent().parent().parent().prevAll('.slider-con').find('ul.img-gallery').last(), idx);
		});
	});
	$(ul.children('li')[0]).addClass("active");
    sliderNav.after('<div class="slider-back-area btn" onclick="goLeft(this);">'
    					+ '<div class="icon-back slider-back btn"></div>'
    				+ '</div>'
    				+ '<div class="slider-next-area btn" onclick="goRight(this);">'
    					+ '<div class="icon-next slider-next btn"></div>'
    				+ '</div>');
        
    showSlideButtons(ul, 0, true);
    visibleImage[visibleImage.length] = 0;
}

/**
* Zeigt das Bild weiter links an.
* @param button - der Button der diese Funktion aufruft. (Der Button befindet
* sich in dem Slider)
*/
function goLeft(button) {
    var ul = $(button).prevAll('div').find('.img-gallery').first();
    showSlide(ul, visibleImage[$('.img-gallery').index(ul)]-1);
}

/**
* Zeigt das Bild weiter rechts an.
* @param button - der Button der diese Funktion aufruft. (Der Button befindet
* sich in dem Slider)
*/
function goRight(button) {
    var ul = $(button).prevAll('div').find('.img-gallery').first();
    showSlide(ul, visibleImage[$('.img-gallery').index(ul)]+1);
}

// Wird benutzt, um eine Höhenveränderungsanimation zu starten, wenn das neue
// Bild komplett angezeigt wird.
var timeoutId = [];

/**
* Zeigt ein bestimmtes Bild in einem Slider an.
* @param ul - das <ul> in dem sich das Bild an Stelle "slide" befindet
* @param slide - die Stelle / Nummer des Bildes im <ul> (startet mit 0)
*/
function showSlide(ul, slide) {
    $('ul.img-gallery').css("transition-duration", "0.5s");
    // Falls Loop aktiviert springt es mit -1 an die letzte Stelle und mit
    // "x.length" an Stelle 0
	if(ul.parent().filter('.loop').length > 0) {
		slide = (ul.children('li').length + slide) % ul.children('li').length;
	}
	var ul_id = $('.img-gallery').index(ul);
    // Für alle Slider
    if((ul.parent().is('.slider') && (slide >= 0 && slide < ul.children('li').length))
       || (ul.parent().is('.slider-nav') && (slide >= 0 && slide*4 < ul.children('li').length))) {
        var ul_id = $('.img-gallery').index(ul);
        visibleImage[ul_id] = slide;
        // Die X-Position an die die Transformation stattfindet
        var x = ul.children('li').width()*slide*-1;
        if(ul.parent().filter('.slider-nav').length > 0) {
        	x = ul.children('li').outerWidth()*slide*-4;
        }
        ul.css({
            transform: "translate3d(" + x + "px, 0px, 0px)"
        });
        // Nur für Slider mit variabler Höhe
        if(ul.not('fixed-size').length > 0 && ul.parent().is('.slider')) {
            var idx = $('.img-gallery').index(ul);
            var check = timeoutId[idx];
            if(!(check >= 0)) {
                timeoutId[idx] = 0;
                check = 0;
            }
            setTimeout(function() {
            	if(check+1 == timeoutId[idx]) {
            		var height = $(ul.children('li')[visibleImage[ul_id]]).height();
            		// if($(ul.children('li')[visibleImage[ul_id]]).children('p').length > 0) {
//             			height += $(ul.children('li')[visibleImage[ul_id]]).children('p').height();
//             		}
            		ul.parent().animate({height: height + "px"}, 500);
            	}
            }, 500);
            timeoutId[idx] += 1;
        }
    }
    // Bildbeschreibung laden
    if(!ul.parent().is(".slider-nav")) {
    	showSlideDescription(ul, slide);
    }
    
    // Zusätzlich für Slider mit Preview Nav
    if(ul.parent().filter('.preview-nav').length > 0) {
    	var allListings = ul.parent().parent().nextAll('.preview-con').find('.slider-nav').first().children('ul.img-gallery').children('li');
    	allListings.removeClass('active');
    	$(allListings[slide]).addClass('active');
		showSlide(allListings.parent(), Math.floor(slide/4));
    }
    showSlideButtons(ul, slide, ul.parent().filter('.slider-nav').length > 0);
}

function showSlideDescription(ul, slide) {
    var p = $(ul.children('li')[slide]).children('p');
    var descDiv = ul.parent().parent().nextAll('.slider-description').first();
    if(p.length > 0) {
    	descDiv.text(p.text());
    	descDiv.show();
    }
    else {
    	descDiv.text("");
    	descDiv.hide();
    }
}

/**
* Zeigt nur die Links und Rechts Buttons an die Möglich sind.
* @param ul - das <ul> in dem sich das Bild an Stelle "slide" befindet
* @param slide - die Stelle / Nummer des Bildes im <ul> (startet mit 0)
* @param isNavigation - true wenn Navigations/Preview-Slider, false sonst.
*/
function showSlideButtons(ul, slide, isNavigation) {
    if(slide > 0 || ul.parent().filter('.loop').length > 0) {
        ul.parent().nextAll('.slider-back-area').show();
    }
    else {
        ul.parent().nextAll('.slider-back-area').hide();
    }
    if((isNavigation && (slide+1)*4 < ul.children('li').length) || (!isNavigation && slide+1 < ul.children('li').length)
    	|| ul.parent().filter('.loop').length > 0) {
        ul.parent().nextAll('.slider-next-area').show();
    }
    else {
        ul.parent().nextAll('.slider-next-area').hide();
    }
}

/**
* Gibt die originale Dimension der Bilddatei zurück
* @param img - ein <img> Element
* @param callback - function(width, height) {} in der etwas mit der Größe
*   gemacht werden kann.
*/
function getImageSize(img, callback){
    img = $(img);

    var wait = setInterval(function(){        
        var w = img.width(),
            h = img.height();

        if(w && h){
            done(w, h);
        }
    }, 0);

    var onLoad;
    img.on('load', onLoad = function(){
        done(img.width(), img.height());
    });


    var isDone = false;
    function done(){
        if(isDone){
            return;
        }
        isDone = true;

        clearInterval(wait);
        img.off('load', onLoad);

        callback.apply(this, arguments);
    }
}

/**
* Zoomt in ein Bild aus einem Slider. (Lightbox mit Bild)
*/
function zoomImage(button) {
    var ul = $(button).prevAll('div').find('.img-gallery').first();
	var vimg = visibleImage[$('.img-gallery').index(ul)];
	$('.img-lightbox').append($(ul.find('img')[vimg]).clone().css('max-height', ''));
	$('.image-zoom-container').show();
	var img = $('.img-lightbox').find('img');
	img.css('margin-left', (parseInt(img.css('margin-left').replace("px","")) - $('.img-lightbox').find('.close').width() -1) + "px");
	$('.img-lightbox').css('top', ($(document).scrollTop() + ($(window).height()-80)/2 - img.height()/2) + "px");
	var leftmargin = parseInt(img.css('margin-left').replace("px",""))+img.width()-5;
	$('.img-lightbox').find('.close').css('left', leftmargin + "px");
	var bottommargin = parseInt(img.css('margin-bottom').replace("px",""))+img.height()-20;
	$('.img-lightbox').find('.close').css('bottom', bottommargin + "px");
}

/**
* Schließt das Zoom fenster, wenn nicht auf das Bild geklickt wurde.
*/
function closeZoom(button) {
	$(button).parent().hide();
	var lb = $(button).parent().find('.img-lightbox');
	lb.find('img').remove();
}

/**
* Passt alle Slider und auch das Zoom Fenster an die Fenstergröße des Browsers
* an.
*/
function resizeAllSliders() {
    $('ul.img-gallery').css("transition-duration", "0s");
    resizeSliders();
    resizeNavigationSliders();
    resizeZoomContainer();
}

/**
* Passt alle Bildergallerien (normalen Slider) an neue Fenstergröße an.
*/
function resizeSliders() {
    $('.slider').each(function() {
        var slider = $(this);
        var ul = slider.children('ul.img-gallery');
        ul.find('img').css('max-height', 'auto');
        var slide = visibleImage[$('.img-gallery').index(ul)];
        var heights = 0;
        var testedImages = 0;
        slider.children('ul.img-gallery').children('li').each(function(i, e) {
            var li = $(this);
            li.css("width", slider.width()+1 + "px");
            getImageSize(li.children("img"), function(width, height){
            	if(li.children('p').length > 0) {
            		li.children('p').height();
            	}
                if(ul.is('.fixed-size')) {
                    testedImages++;
                    heights = Math.max(height, heights);
					if(testedImages == ul.children('li').length) {
						if(ul.css("max-height") != "none") {
							heights = Math.min(heights, ul.css("max-height").replace("px", ""));
						}
						ul.children('li').css('height', heights + "px");
                        slider.css("height", heights + "px");
					}
                }
                else {
                    var maxHeight = height + "px";
                    if(height > ul.css("max-height").replace("px", "") && ul.css("max-height") != "none" ) {
                         maxHeight = ul.css("max-height");
                    }
                    li.css("height", maxHeight);
                    if(i == slide) {
            			//if(li.children('p').length > 0) {
            			//	maxHeight = height + li.children('p').height() + "px";
            			//}
                        slider.css("height", maxHeight);
                    }
                }
                li.children('img').css('max-height', '100%');
            });
        });
        var x = ul.children('li').width()*slide*-1;
        ul.css({
            width: ul.children('li').outerWidth() * ul.children('li').length + "px",
            transform: "translate3d(" + x + "px, 0px, 0px)"
        });
    });
}

/**
* Passt alle Slider Navigationen an neue Fenstergröße an.
*/
function resizeNavigationSliders() {
    $('.slider-nav').each(function() {
        var slider = $(this);
        var ul = slider.children('ul.img-gallery');
        var slide = visibleImage[$('.img-gallery').index(ul)];
        var fullWidth = slider.width();
        var liWidth = fullWidth / 4.5;
        var liHeight = fullWidth / 6.0;
        ul.children('li').css({
            width: liWidth + "px",
            height: liHeight + "px"
        });
        var x = ul.children('li').outerWidth()*slide*-4;
        ul.css({
            width: liWidth * (ul.children('li').length) + "px",
            height: liHeight + "px",
            transform: "translate3d(" + x + "px, 0px, 0px)"
        });
        slider.css("height", liHeight + "px");
    });
}

/**
* Passt Zoom Container an neue Fenstergröße an.
*/
function resizeZoomContainer() {
    if($('.image-zoom-container').is(':visible')) {
    	var img = $('.img-lightbox').find('img');
        img.css('margin-left', "");
        img.css('margin-left', (parseInt(img.css('margin-left').replace("px","")) - $('.img-lightbox').find('.close').width() -1) + "px");
		var leftmargin = parseInt(img.css('margin-left').replace("px",""))+img.width()-5;
		$('.img-lightbox').find('.close').css('left', leftmargin + "px");
		var bottommargin = parseInt(img.css('margin-bottom').replace("px",""))+img.height()-20;
		$('.img-lightbox').find('.close').css('bottom', bottommargin + "px");
    }
}


// --------------------------------------------------------------------------------------
// Tooltips
// --------------------------------------------------------------------------------------

var activeTooltip = 0;
var tooltips = ['<div id="tooltipShowAll" class="tooltip fixed">'
            	+ 'Alle Inhalte auf einer Seite anzeigen <br>oder vertikal navigierbar machen.'
            	+ '</div>',
            	'<div id="tooltipChapter" class="tooltip fixed">'
            	+ 'Klappt die Kapitelübersicht zur schnellen <br>Navigation aus bzw. ein.'
            	+ '</div>',
            	'<div id="tooltipMenu" class="tooltip fixed right">'
            	+ 'Öffnet ein Menü mit Optionen zum Drucken <br>und Teilen der Seite sowie der Anzeige von <br>Informationen.'
            	+ '</div>',
            	'<div id="tooltipArrowRight" class="tooltip fixed right">'
            	+ 'Klicken, um auf die nächste Seite zu wechseln.'
            	+ '</div>',
            	'<div id="tooltipArrowLeft" class="tooltip fixed left">'
            	+ 'Klicken, um auf die vorherige Seite zu wechseln.'
            	+ '</div>'];
            	
var ttMaxWidth = [-1, -1, -1, 440, 440];
var anchor = ["#btnAll", "#btnExp", "#btnMenu", "#btnNext", "#btnPrev"];
var positions = ["#btnAll", "#btnExp", "#btnMenu", [0,0], [0,0]];

/**
* Fügt die Buttons und die Funktionen der Buttons hinzu, die zum Durchklicken der
* Tooltips bzw. zum Schließen nötig sind.
*/
function initiateTooltips() {
	for(var i=0, tt=tooltips[0]; i<tooltips.length; i++, tt=tooltips[i]) {
		$('.page').before(tt);
	}
    $('.tooltip').prepend('<div id="cancel">x</div>');
    $('.tooltip').append('<div><button id="next">Nächster</button></div>');
    $('.tooltip').find('#cancel').click(function() {
        activeTooltip = 0;
        closeTooltips();
    });
    $('.tooltip').find('#next').click(function() {
        nextTooltip();
    });
}

/**
* Wird von dem "Hilfe" Button aufgerufen. Öffnet den ersten Tooltip.
*/ 
function startHelp() {
    showTooltip(0);
}

/**
* Zeigt den Tooltip mit der übergebenen Nummer an. 
* (id = "tooltipX" : mit X - Nummer des Tooltips)
*/
function showTooltip(nr) {
    closeTooltips();
    if($('.tooltip').length <= nr) {
        activeTooltip = 0;
        return;
    }
    activeTooltip = nr;
    if($(window).width() > ttMaxWidth[nr] && $(anchor[nr]).is(":visible")) {
    	if(typeof positions[nr] == 'string' && !$(positions[nr]).is(':visible')) {
    		nextTooltip();
    		return;
    	}
    	if(typeof positions[nr] == 'string') {
    		if($($('.tooltip')[nr]).is(".right")) {
    			setTooltipPosition(nr, true, 
    							$(positions[nr]).offset().top 
    							+ parseInt($(positions[nr]).css("margin-top").replace(/\D/g, "")) + 38,
    							$('#wrap').width() 
    							- ($(positions[nr]).offset().left 
    							 + parseInt($(positions[nr]).css("margin-left").replace(/\D/g, ""))
    							 - $('#wrap').offset().left) - 40);
    		}
    		else {
    			setTooltipPosition(nr, false, 
    							$(positions[nr]).offset().top
    							+ parseInt($(positions[nr]).css("margin-top").replace(/\D/g, "")) + 40,
    							$(positions[nr]).offset().left
    							+ parseInt($(positions[nr]).css("margin-left").replace(/\D/g, ""))
    							- $('#wrap').offset().left - 10);
    		}
    	}
    	else {
    		setTooltipPosition(nr, true, 
    						positions[nr][0],
    						positions[nr][1]);
    	}
    }
    else {
    	nextTooltip();
    	return;
    }
    $($('.tooltip')[nr]).show();
}

function setTooltipPosition(nr, isRight, top, leftRight) {
	if(isRight) {
		$($('.tooltip')[nr]).css({
			"margin-top": top + "px",
			"margin-right": leftRight + "px"
		});
	}
	else {
		$($('.tooltip')[nr]).css({
			"margin-top": top + "px",
			"margin-left": leftRight + "px"
		});
	}
}

/**
* Zeigt den nächsten Tooltip an. (Eine Nummer weiter)
*/
function nextTooltip() {
    showTooltip(activeTooltip+1);
}

/**
* Schließt alle Tooltips.
*/
function closeTooltips() {
    $('.tooltip').hide();
}



// --------------------------------------------------------------------------------------
// Window RESIZING
// --------------------------------------------------------------------------------------
var resizeTimer;

/**
* Berechnet alle notwendigen Größen neu.
*/
$(window).resize(function() {
	clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function(){ 
    	resizeAllSliders();
    	$('#sideMenu').css('right', "-"+($('#sideMenu').width()+10)+"px"); 
	}, 250);
    
});

// --------------------------------------------------------------------------------------
// KeyPress Part (Arrow Left/Right)
// --------------------------------------------------------------------------------------
/**
* Fügt Pfeiltastennavigation durch Sections hinzu.
*/
$(document).keyup(function(e){
	if(!allShown) {
		if(e.keyCode == 37) {
			showPrev();
		}
		else if(e.keyCode == 39) {
			showNext();
		}
	}
});

// --------------------------------------------------------------------------------------
// Touch Scroll part
// --------------------------------------------------------------------------------------

var maxDiff = 0;
var clickedAlready = false;

/**
* Fügt allen Sections eine Touchabfrage hinzu.
*/
function addTouchToSections() {
	$("body").bind('touchstart', function() {
		touchStart(event, this);
	});
	$("body").bind('touchend', function() {
		touchEnd(event);
	});
	$("body").bind('touchmove', function() {
		touchMove(event);
	});
	$("body").bind('touchcancel', function() {
		touchCancel(event);
	});
	
	$("body").click(function(event) {
	    if(!$(event.target).is('label')) {
	        var p = $(event.target);
	        while(!p.is("body") && !p.is("label")) {
	            p = p.parent();
	        }
	        if(!p.is("label")) preventDefault();
	    }
		clickedAlready = true;
	});
	
	
	maxDiff = $("body").width()/4;
	$('#leftTouch').css('width', maxDiff-1);
	$('#rightTouch').css('width', maxDiff-1);
	$('#leftTouch').css('left', '-' + maxDiff + 'px');
	$('#rightTouch').css('right', '-' + maxDiff + 'px');
};


// TOUCH-EVENTS SINGLE-FINGER SWIPE-SENSING JAVASCRIPT
// Courtesy of PADILICIOUS.COM and MACOSXAUTOMATION.COM

// this script can be used with one or more page elements to perform actions based on them being swiped with a single finger

var triggerElementID = null; // this variable is used to identity the triggering element
var fingerCount = 0;
var startX = -1;
var startY = -1;
var curX = -1;
var curY = -1;
var swipeLength = 0;
var swipeAngle = null;
var swipeDirection = null;
var swipeStarted = false;
var isHorizontalSwipe = true;
var swipeDirectionSet = false;
var swipeType = "normal";
var swipeTarget = null;
var lastSpeed = 0;
var lastTime = 0;
var lastDif = 0;

/**
* Überprüft, um welche Touchfunktion es sich handelt.
* Abhängig davon, welches Element berührt wurde und in welche Richtung sich der Finger
* bewegt.
*/
function setSwipeType() {
    if(swipeTarget.is('.slider') || swipeTarget.is('.slider *') 
    	|| swipeTarget.is('.slider-nav') || swipeTarget.is('.slider-nav *')) {
        swipeType = "slider";
        
        var ul = $(swipeTarget);
        while(ul.filter('.slider').length == 0 && ul.filter('.slider-nav').length == 0) {
            ul = ul.parent();
        }
        ul = ul.children("ul.img-gallery");
        swipeTarget = ul;
        ul.css("transition-duration", "0s");
    }
	else if(!allShown && (swipeTarget.is('section') || swipeTarget.is('section *'))) {
		swipeType = "section";
	}
	else if($(document).width() - event.touches[0].pageX < 20 && !isSideMenuVisible()) {
		swipeType = "menu";
		$('.menu-wrap').css('top', $('#navigation').height() + "px");
	}
	else if(isSideMenuVisible()) {
		swipeType = "menu-back";
		$('.menu-wrap').css('top', $('#navigation').height() + "px");
	}
	else {
		swipeType = "normal";
	}
}

function touchStart(event,passedName) {
	if(swipeDirectionSet && isHorizontalSwipe) {
		event.preventDefault();
	}
	
	swipeTarget = $(event.target);
	setSwipeType();
	
	fingerCount = event.touches.length;
	if ( fingerCount == 1 ) {
		swipeStarted = true;
		startX = event.touches[0].pageX;
		startY = event.touches[0].pageY;
		triggerElementID = passedName;
	} else {
		touchCancel(event);
	}
}
function touchMove(event) {
	if ( event.touches.length == 1 ) {
		curX = event.touches[0].pageX;
		curY = event.touches[0].pageY;
		
		if(!swipeDirectionSet) {
			setSwipeDirection();
		}
		if(isHorizontalSwipe) {
			event.preventDefault();
		}
		else {
			swipeType = "normal";
		}
		
		var dif = startX - curX;
		
		calcSpeed(dif);
		
		if(isHorizontalSwipe) {
			if(swipeType == "section") {
				touchMoveSection(dif);
			}
			if(swipeType == "menu" && dif > 0) {
				touchMoveMenu(dif);
			}
			if(swipeType == "menu-back") {
				touchMoveMenu($('#sideMenu').width() + dif);
			}
            if(swipeType == "slider") {
                touchMoveSlider(dif, swipeTarget);
            }
		}
	} else {
		touchCancel(event);
	}
}

function touchEnd(event) {
	if ( fingerCount == 1 && curX >= 0 ) {
		//swipeLength = Math.round(Math.sqrt(Math.pow(curX - startX,2) + Math.pow(curY - startY,2)));
		if((swipeType == "menu" || swipeType == "menu-back") && !isSideMenuVisible()) {
			touchEndMenu();
		}
        if(swipeType == "slider") {
        	touchEndSlider();
        }
		if (swipeType == "section" && Math.abs(curX - startX) >= maxDiff) {
			touchEndSection();
		} else {
			touchCancel(event);
		}	
	} else {
		touchCancel(event);
	}
	touchCancel(event);
}

function touchCancel(event) {
	touchCancel(event, -1);
}

function touchCancel(event, dir) {
    if(swipeType == "slider") {
            $(swipeTarget).css("transition-duration", "0.6s");
    }
	event.preventDefault();
	if(triggerElementID != null) {
		checkClicked();
		fingerCount = 0;
		startX = -1;
		startY = -1;
		curX = -1;
		curY = -1;
		swipeLength = 0;
		swipeAngle = null;
		swipeDirection = null;
		triggerElementID = null;
		isHorizontalSwipe = true;
		swipeDirectionSet = false;
		lastSpeed = 0;
		lastTime = 0;
		lastDif = 0;
		$('#leftTouch').animate({'margin-left':'0'}, { duration: 200, queue: false });
		$('#rightTouch').animate({'margin-right':'0'}, { duration: 200, queue: false });
		$('#leftTouch').animate({'opacity':'0'}, { duration: 200, queue: false });
		$('#rightTouch').animate({'opacity':'0'}, { duration: 200, complete: function() {
			if(dir != -1 && swipeStarted) {
				processingRoutine(dir, swipeType);
			}
			swipeStarted = false;
			swipeTarget = null;
		}});
	}
}

function setSwipeDirection() {
	if(curX != startX || curY != startY) {
		caluculateAngle();
		determineSwipeDirection();
		if(swipeDirection == 'left' || swipeDirection == 'right') {
			isHorizontalSwipe = true;
		}
		else {
			isHorizontalSwipe = false;
		}
		swipeDirectionSet = true;
	}
};

function caluculateAngle() {
	var X = startX-curX;
	var Y = curY-startY;
	var Z = Math.round(Math.sqrt(Math.pow(X,2)+Math.pow(Y,2)));
	var r = Math.atan2(Y,X);
	swipeAngle = Math.round(r*180/Math.PI);
	if ( swipeAngle < 0 ) { swipeAngle =  360 - Math.abs(swipeAngle); }
}

function determineSwipeDirection() {
	if ( (swipeAngle <= 45) && (swipeAngle >= 0) ) {
		swipeDirection = 'left';
	} else if ( (swipeAngle <= 360) && (swipeAngle >= 315) ) {
		swipeDirection = 'left';
	} else if ( (swipeAngle >= 135) && (swipeAngle <= 225) ) {
		swipeDirection = 'right';
	} else if ( (swipeAngle > 45) && (swipeAngle < 135) ) {
		swipeDirection = 'down';
	} else {
		swipeDirection = 'up';
	}
}

function processingRoutine(dir, type) {
	if(type == "section") {
		if ( dir == 'left' ) {
			showNext();
		} else if ( dir == 'right' ) {
			showPrev();
		} else if ( dir == 'up' ) {
		} else if ( dir == 'down' ) {
		}
	}
}

var x = 0;
/**
* Aktiviert das Klicken auf alle Elemente in Sections.
*/
function checkClicked() {
	if(startX >= 0 && startY >= 0 && curX == -1 && curY == -1) {
		x++;
		var clicked = $(document.elementFromPoint((startX - $(document).scrollLeft()), (startY - $(document).scrollTop())));
		
		if(!clickedAlready) {
			clicked.focus();
			clicked.click();
		}
		clickedAlready = false;
	}
}

// ---------------------------------------------------------------------------------------
// Spezialisierte TouchMove Operationen. 
// (Werden aufgerufen, wenn sich der Finger auf dem Bildschirm bewegt)
// ---------------------------------------------------------------------------------------

/**
* Wird aufgerufen, wenn wie die aktuelle Touchbewegung Horizontal ist und von einer Section ausgeht.
*/
function touchMoveSection(dif) {
	if(dif >= 0 && visSection < $('section').length - 1) // nach Links streifen, rechts kommt raus
	{
		if(dif > maxDiff) {
			dif = maxDiff;
		}
		$('#rightTouch').css('margin-right', dif.toFixed(2)+'px');
		$('#rightTouch').css('opacity', dif/maxDiff);

		var innerOp = dif/maxDiff;
		if(innerOp < 0.90) {
			innerOp = 0.25;
		}
		else {
			innerOp = ((innerOp-0.90)*7.5) + 0.25;
		}
		$('#rightTouch').find('div').find('p').css('opacity', innerOp);
	}
	else if(dif < 0 && visSection > 0)  // nach rechts streifen, links kommt raus
	{
		dif = dif*(-1);
		if(dif > maxDiff) {
			dif = maxDiff;
		}
		$('#leftTouch').css('margin-left', dif.toFixed(2)+'px');
		$('#leftTouch').css('opacity', dif/maxDiff);

		var innerOp = dif/maxDiff;
		if(innerOp < 0.90) {
			innerOp = 0.25;
		}
		else {
			innerOp = ((innerOp-0.90)*7.5) + 0.25;
		}
		$('#leftTouch').find('div').find('p').css('opacity', innerOp);
	}
}

/**
* Wird aufgerufen wenn momentan die Touchfunktion für das Side-Menu läuft.
*/
function touchMoveMenu(dif) {
	$('#sideMenu').show();
	var width = $('#sideMenu').width();
	if(dif > width) {
		dif = width;
	}
	$('#sideMenu').css("right", (dif - width)+"px");
}

/**
* Wird aufgerufen wenn momentan die Touchfunktion für Slider (Bildergallerien) 
* läuft.
*/
function touchMoveSlider(dif, ul) {
    var vimg = visibleImage[$('.img-gallery').index(ul)];
    ul.css("margin-left", -dif + "px");
}

// ---------------------------------------------------------------------------------------
// Spezialisierte TouchEnd Operationen. 
// (Werden aufgerufen, wenn sich der Finger vom Bildschirm löst.)
// ---------------------------------------------------------------------------------------

function touchEndSection() {
	caluculateAngle();
	determineSwipeDirection();
	var dir = swipeDirection;
	touchCancel(event, dir);
}

function touchEndSlider() {
	var dif = startX - curX;
	var ul = $(swipeTarget);
	var vimg = visibleImage[$('.img-gallery').index(ul)];
	var margin = parseInt(ul.css("margin-left").replace("px", ""));
	var x = parseInt(-vimg*$(swipeTarget).children("li").width());
	if(ul.parent().is('.slider-nav')) {
		x = parseInt(-4*vimg*$(swipeTarget).children("li").outerWidth());
	}
	x += margin;
	ul.css({
		transform: "translate3d("+x+"px, 0px, 0px)",
		margin: "0 0 0 0"
	});
	
	if(lastSpeed*6 + (dif / $(swipeTarget).children("li").width())*0.5 > 1) {
		if((!ul.parent().is('.slider-nav') && vimg < ul.children('li').length-1) 
			|| (ul.parent().is('.slider-nav') && (vimg+1)*4 < ul.children('li').length) 
			|| ul.parent().filter('.loop').length > 0) {
			vimg++;
		}
	}
	else if(lastSpeed*6 + (dif / $(swipeTarget).children("li").width())*0.5 < -1) {
		if(vimg > 0 || ul.parent().filter('.loop').length > 0) {
			vimg--;
		}
	}
	var speed = (1-Math.abs(dif / $(swipeTarget).children("li").width()))*0.5;
	if(vimg == visibleImage[$('.img-gallery').index(ul)]) {
		speed = 0.5;
	}
	ul.css("transition-duration", speed+"s");
	showSlide(ul, vimg);
	ul.css("transition-duration", "0.5s");
}


function touchEndMenu() {
	if(lastSpeed > 0.3) {
		$('#sideMenu').animate({
			right: 0,
			}, 200, 
			function() {
		});
	}
	else {
		$('#sideMenu').animate({
			right: "-="+$('#sideMenu').width(),
			}, 200, 
			function() {
		});
	}
}

// ---------------------------------------------------------------------------------------
// Hilfsfunktionen für Touch-Funktion
// ---------------------------------------------------------------------------------------

/**
* Berechnet die Slide-Geschwindigkeit
*/
function calcSpeed(dif) {
	var d = new Date();
	var time = d.getTime();
	
	lastSpeed = getSpeed(lastDif, lastTime, dif, time);
	lastDif = dif;
	lastTime = time;
}

function getSpeed(lastDif, lastTime, dif, time) {
	return (dif-lastDif) / (time - lastTime);
}
