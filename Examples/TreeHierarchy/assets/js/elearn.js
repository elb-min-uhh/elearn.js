/*
* v0.9.7 16/12/21 JavaScript eLearn.js - by Arne Westphal
* eLearning Buero MIN-Fakultaet - Universitaet Hamburg
* touch-script base by PADILICIOUS.COM and MACOSXAUTOMATION.COM
*/

var VERSION_NR = "0.9.7";
var VERSION_DATE = "12/2016";

// Will be set on first Touch event. See Help Functions at bottom
var touchSupported = false;

var visSection = 0;
var allShown = false;
var overviewShown = false;
var navigationTitle = "";

var backbuttonEnabled = false;
var backpage = 0;
var backpagetype = "index";


var blockProgressQuizJS = false;
var blockProgressAlertActivated = false;
var blockProgressAlertText = "";
var blockProgressShowElementActivated = false;
var blockProgressShowElementText = "";

// Zum generellen Aktivieren oder Deaktivieren der Knöpfe
var dirButtonsEnabled = true;
var keyNavigationEnabled = true;
var progressbarEnabled = true;

// Funktionen die aufgerufen werden, wenn eine neue section angezeigt wird
// diese sind registrierbar mit registerAfterShow(KEY, FNC)
var afterShow = {};
var afterPageInteraction = {};
// für tabbed boxes / multiboxes
var afterTabChange = {};

// Nur damit Scriptaufrufe übersichtlicher sind.
var eLearnJS = this;

/**
* Going back in History without reloading the page.
*/
window.onpopstate = function(e){
    e.stopPropagation();
    e.preventDefault();
    if(e.state == undefined || e.state.p == null || e.state.p == undefined) {
        setTimeout(function() {showSection(parseInt(0));}, 100);
    }
    else {
        setTimeout(function() {showSection(parseInt(e.state.p));}, 100);
    }
};

// --------------------------------------------------------------------------------------
// Initialisierungsfunktion
// --------------------------------------------------------------------------------------

$(document).ready(function() {
    initiateELearnJS();
    initiateInfo();
    initiateSections();
    initiateGalleries();
    initiateSideMenu();
    initiateTooltips();
    initiateHideables();
    initiateTabbedBoxes();
    initiateHoverInfos();
    //initiateVideoPlayers();
    updateNavBarWidth();

    registerAfterShow("slider-resize", resizeAllSliders);
    registerAfterPageInteraction("history-push", pushHistoryState);

    checkParameters();

    $('#qrcode').qrcode({
        "width": 256,
        "height": 256,
        "text": window.location.href
    });
    $('#qr_overlay').click(function() {$('#qr_overlay').hide();});
});

/**
* Fügt alle notwendigen Elemente in den Quelltext ein.
*/
function initiateELearnJS() {
    $($('#wrap')[0]).prepend(
            "<div class='skip-arrows'>" // <!-- Arrow Left and Right -->
                + "<div onclick='javascript: showPrev();' id='btnPrev' class='icon-back before-padding btn'></div>"
                + "<div onclick='javascript: showNext();' id='btnNext' class='icon-next before-padding btn'></div>"
            + "</div>"
            + "<div class='section-overview'></div>" // <!-- Container for Overview -->
            + "<div id='navigation'>"
                // <!-- Grey Top Menu-bar - Reihenfolge wichtig -->
                + "<div id='nav-bar'>"
                    + "<div onclick='javascript: backButtonPressed();' id='btnBackCon' class ='btn' title='Zurück zur Übersicht'><div class='icon-font' id='btnBack'>b</div><div id='btnBackText'>Zurück</div></div>"
                    + "<div onclick='javascript: toggleAllSections();' id='btnAllCon' class ='btn' title='Zeige/verstecke Bereiche'><div class='icon-font' id='btnAll'>s</div><div id='btnAllText'>Ansicht</div></div>"
                    + "<div onclick='javascript: showSectionOverview();' id='btnExp' class ='btn' title='Inhaltsverzeichnis'><div class='icon-font' id='btnExpSym'>c</div><div id='nav-title'>Name des Moduls</div></div>"
                    + "<div onclick='javascript: toggleSideMenu(isSideMenuVisible());' id='btnMenu' class ='icon-font btn' title='Menü'>m</div>"
                    + "<div onclick='javascript: startHelp();' id='btnHelp' class ='btn' title='Zeige/verstecke Bereiche'><div class='icon-font' id='btnHelpSym'>q</div><div id='btnHelpText'>Hilfe</div></div>"
                    + "<div style='clear:both'></div>"
                + "</div>"
                // <!-- Touch Gesture Elements -->
                + "<div class='touchScroll' id='rightTouch'><div><p>n</p></div></div>"
                + "<div class='touchScroll' id='leftTouch'><div><p>b</p></div></div>"
                // <!-- Progress bar -->
                + "<div id='progressback'><div id='progressbar'></div></div>"
                // <!-- SIDE MENU -->
                + "<div class='menu-wrap'></div>"
            + "</div>"
            + "<div id='qr_overlay'><div id='qrcode'></div></div>");

    // Anhand der Scrollposition merken welche Section aktiv war.
    $(document).scroll(function() {
        if(allShown) {
            var scrollTop = $(document).scrollTop();
            var i = visSection;
            var sHeight = $($('section')[i]).position().top - $('#navigation').height() - 15;
            while(sHeight < scrollTop) {
                i++;
                if(i == $('section').length) {
                    i -= 1;
                    break;
                }
                sHeight = $($('section')[i]).position().top - $('#navigation').height() - 15;
            }
            while(sHeight > scrollTop) {
                i--;
                if(i < 0) {
                    i = 0;
                    break;
                }
                sHeight = $($('section')[i]).position().top - $('#navigation').height() - 15;
            }
            visSection = i;
            updateContentOverview();
        }
    });
}

/**
* Erstellt die einfachen Buttons, die das Vor- und Zurückgehen sowie das Anzeigen
* aller Sections ermöglichen
*/
function initiateSections() {
    $('#progressbar').css('width', 100/$('section').length + "%");
    navigationTitle = $('#nav-title').text();
    addTouchToSections();
    createContentOverview();
    createSectionOverview();
    $('.section-overview').css('top', $('nav-bar').outerHeight() + "px");
    $('.section-overview').css('height', "calc(100% - " + $('.section-overview').css("top") + ")");
    //$('#sideMenu').css('max-width', Math.min($('#sideMenu').width(), $(document).width()) + "px");
    setDirectionButtonsEnabled(true);
    setProgressbarEnabled(true);
    showSection(0);
};

/**
* Erstellt das SideMenu
*/
function initiateSideMenu() {
    var downloadUrl = "./download.zip";
    var downloadPDF = "./page.pdf";
    var downloadEPUB = "./page.epub";
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
                                + '<td class="side-menu-content">Impressum</td>'
                            + '</tr>'
                            + '<tr class="side-menu-element" id="menu-item-download" onclick="javascript: startDownload(\''+downloadUrl+'\');">'
                                + '<td class="side-menu-icon"><div class="icon-zip"></div></td> '
                                + '<td class="side-menu-content">Quelldateien herunterladen</td>'
                            + '</tr>'
                            + '<tr class="side-menu-element" id="menu-item-download-pdf" onclick="javascript: startDownload(\''+downloadPDF+'\');">'
                                + '<td class="side-menu-icon"><div class="icon-pdf"></div></td> '
                                + '<td class="side-menu-content">PDF herunterladen</td>'
                            + '</tr>'
                            + '<tr class="side-menu-element" id="menu-item-download-epub" onclick="javascript: startDownload(\''+downloadEPUB+'\');">'
                                + '<td class="side-menu-icon"><div class="icon-epub"></div></td> '
                                + '<td class="side-menu-content">EPUB herunterladen</td>'
                            + '</tr>'
                        + '</table></div>'
                        + '</div>');
    doesURLExist(downloadUrl, function(exists) {
        if(!exists) {
            $('#menu-item-download').hide();
        }
    });
    doesURLExist(downloadPDF, function(exists) {
        if(!exists) {
            $('#menu-item-download-pdf').hide();
        }
    });
    doesURLExist(downloadEPUB, function(exists) {
        if(!exists) {
            $('#menu-item-download-epub').hide();
        }
    });
    $('#sideMenu').css('right', "-"+($('#sideMenu').width()+10)+"px");
}


function updateNavBarWidth() {
    var headerSpace = 15; // standard wert
    $('#nav-bar').children(':visible').not('#btnExp').each(function(i,e){
        if($(this).attr("id") != undefined && $(this).attr("id").length)
            headerSpace += $(this).outerWidth(true);
    });
    $('#btnExp').css("width", "calc(100% - " + headerSpace + "px)");
}


/**
* In der URL können Parameter angegeben werden, um das direkte Anzeigen einer
* Section zu ermöglichen.
*
* mit ?p=2 könnte man z.B. die 3. (0, 1, 2, ...) section öffnen
* mit ?s=Inhaltsverzeichnis würde man die <section name="Inhaltsverzeichnis">
* öffnen.
*/
function checkParameters() {
    if(QueryString.s != undefined) {
        var sectionName = decodeURI(QueryString.s);
        showSection(sectionName);
    }
    else if(QueryString.p != undefined) {
        var idx = parseInt(QueryString.p);
        showSection(idx);
    }
}

// ----------------------------------------------------------------------------
// ------------------------- BACK BUTTON --------------------------------------
// ----------------------------------------------------------------------------

/**
* Zeigt den "Back-Button" an oder blendet ihn aus.
* Standardmäßig aus
*/
function setBackButtonEnabled(b) {
    backbuttonEnabled = b;
    if(b) {
        $('#navigation').addClass("back-enabled");
    }
    else {
        $('#navigation').removeClass("back-enabled");
    }
}

/**
* Gibt aus ob der backbutton aktiviert ist.
*/
function isBackButtonEnabled() {
    return backbuttonEnabled;
}


/**
* Ändert die Beschriftung des Back-Buttons.
* Standardmäßig "Zurück"
*/
function setBackButtonText(text) {
    $('#btnBackText').text(text);
    updateNavBarWidth();
}


/**
* Zeigt die interpretierte backpage und öffnet sie je nachdem welcher
* backpagetype eingestellt wurde
* Standardmäßig wird die erste <section> angezeigt
*/
function backButtonPressed() {
    if(backpagetype === "name") {
        var idx = $('section').index($('section[name="' + backpage + '"]').get(0));
        overviewShowSection(idx);
    }
    else if(backpagetype === "index") {
        overviewShowSection(backpage);
    }
    else if(backpagetype === "link") {
        window.open(backpage, "_self")
    }
}

/**
* Stellt ein worauf der Back-Button verlinkt. Dabei kann auf verschiedene
* Typen verlinkt werden
* @param val : hier wird der Wert eingetragen, der zusammen mit dem type als
*               Ziel ausgewertet wird.
* @param type : gibt an wie "val" interpretiert wird
            "name" entspricht dem name attribut einer <section>. Dieser name
*               sollte dann bei val als String übergeben werden
*           "index" entspricht dem index einer <section>. Die erste section
*               ist dabei 0 und sie werden aufsteigend nummeriert.
*           "link" entspricht einem HREF Link. Dieses kann relativ auf der
*               Seite verlinken wie zB. "../andereSeite" oder auf eine
*               auf eine ganz andere Seite verlinken wie "http://google.com"
*
* Beispiel: setBackPage("http://google.com", "link"); verlinkt auf Google.
* Standardmäßig wird die erste <section> angezeigt
*/
function setBackPage(val, type) {
    backpagetype = type;
    backpage = val;
}

// ----------------------------------------------------------------------------
// ------------------------- VIDEO PLAYER -------------------------------------
// ----------------------------------------------------------------------------

var video_hover_timers = {};
var video_volumes = {};
const video_timetypes = {
    TIMELEFT : 0,
    DURATION : 1
};
var video_timestyle = 0;

function initiateVideoPlayers() {
    $('video').each(function(i,e) {
        this.controls = false;
        $(this).wrap("<div class='elearnjs-video hovered'>");

        var div = $(this).parent();

        div.append("<div class='mobile-overlay'><div class='icon playpause paused'></div></div>");
        if(this.autoplay) {
            this.play();
        }
        else {
            div.append("<div class='play-overlay'><div class='icon play'></div></div>");
        }
        div.append("<div class='controls'>"
                        + "<div class='icon playpause playing' title='Play'></div>"
                        + "<div class='icon volume high' title='Mute'></div>"
                        + "<div class='text playtime' title='Time'></div>"
                        + "<div class='video-progress-con'>"
                            + "<div class='video-progress'><div class='video-progress-loaded'></div><div class='video-progress-bar'></div></div>"
                        + "</div>"
                        + "<div class='text timeleft' title='Time left'></div>"
                        + "<div class='icon fullscreen' title='Fullscreen'></div>"
                    + "</div>");


        addVideoPlayerListener(div);
    });
    registerAfterShow("resizeVideos", resizeAllVideoPlayers);
    resizeAllVideoPlayers();
}

function addVideoPlayerListener(div) {
    div.on('touchstart touchend touchcancel', function(event) {
        videoRefreshHover(div, event);
    });
    // buttons
    div.find('.playpause').click(function(event) {
        event.preventDefault();
        event.stopPropagation();
        videoTogglePlay(div);
    });
    div.find('.volume').on('mouseup touchend', function(event) {
        event.preventDefault();
        event.stopPropagation();
        videoVolumeClick(div, event);
    });
    div.find('.timeleft').click(function(event) {
        event.preventDefault();
        event.stopPropagation();
        videoToggleTimeleftDuration(div);
    });
    div.find('.fullscreen').click(function(event) {
        event.preventDefault();
        event.stopPropagation();
        videoToggleFullscreen(div);
    });

    // overlay
    div.find('.play-overlay').on('mouseup touchend', function(event) {
        event.preventDefault();
        event.stopPropagation();
        touchCancel(event);
        if(event.type === "touchend"
            || event.button == 0) {
                videoTogglePlay(div);
                videoHover(div);
                div.find('.play-overlay').remove();
        }
    });

    // progressbar
    div.find('.video-progress-con').on('mouseenter', function(event) {
        event.preventDefault();
        event.stopPropagation();
        videoProgressMouseEnter(div, event);
    });
    div.find('.video-progress-con').on('mouseleave', function(event) {
        event.preventDefault();
        event.stopPropagation();
        videoProgressMouseLeave(div, event);
    });
    div.find('.video-progress-con').on('mousemove touchmove', function(event) {
        event.preventDefault();
        event.stopPropagation();
        videoProgressMouseMove(div, event);
    });
    div.find('.video-progress-con').on('mousedown touchstart', function(event) {
        event.preventDefault();
        event.stopPropagation();
        setVideoMouseDown(div, true);
        videoProgressMouseMove(div, event);
        if(event.type === "touchstart") div.append('<div class="progress-hover-time"></div>');
    });
    $(document).on('mouseup touchend', function(event) {
        if((event.type === "touchend" || event.button == 0) && videoMouseDown) {
            if(videoMouseDownTarget != null) {
                event.preventDefault();
                event.stopPropagation();
                setVideoMouseDown(videoMouseDownTarget, false);
                if(event.type === "touchend") div.find('.progress-hover-time').remove();
            }
            return false;
        }
        else {
            return true;
        }
    });

    // general player
    div.on('mousemove', function(event) {
        if(!isTouchSupported()) {
            videoHover(div);
        }
    });
    div.on('mouseup touchend', function(event) {
        if(event.type === "touchend" || event.button == 0) {
            // other listeneres take care of these
            if(videoMouseDown
                || $(event.target).is('.controls') || $(event.target).is('.controls *')
                || $(event.target).is('.play-overlay') || $(event.target).is('.play-overlay *')
                || $(event.target).is('.mobile-overlay .playpause')) {
                return true;
            }

            event.preventDefault();
            event.stopPropagation();

            // touch
            if(event.type === "touchend") {
                videoToggleHover(div);
            }
            // no touch
            else {
                videoOnClick(div);
            }
        }
    });
    div.find('video').on('ended', function(event) {
        videoHover(div);
    });
    div.find('video').on('timeupdate', function(event) {
        updateVideoTime(div);
    });
    div.find('video').on('play', function(event) {
        videoUpdatePlayPauseButton(div);
    });
    div.find('video').on('pause', function(event) {
        videoUpdatePlayPauseButton(div);
    });


    $(document).bind('webkitfullscreenchange mozfullscreenchange fullscreenchange', function() {
        checkVideoFullscreen();
    });
    div.on('webkitfullscreenchange mozfullscreenchange fullscreenchange', function(event) {
        checkVideoFullscreen();
    });
    div.find('video').on('webkitfullscreenchange mozfullscreenchange fullscreenchange', function(event) {
        checkVideoFullscreen();
    });
}


// HOVER ---------------------------------------------------

function videoToggleHover(div) {
    if(div.is('.hovered')) {
        videoHoverEnd(div);
    }
    else {
        videoHover(div);
    }
}

function videoRefreshHover(div, event) {
    var trgt = $(event.target);
    if(trgt.is('.controls') || trgt.is('.controls *')
        || trgt.is('.mobile-overlay *')) {

        videoHover(div);
    }
}

function videoHover(div) {
    if(!div.is(".hovered")) {
        div.addClass("hovered");
        resizeVideoPlayer(div);
    }
    var idx = $('.elearnjs-video').index(div);
    if(video_hover_timers[idx] != undefined) clearTimeout(video_hover_timers[idx]);
    video_hover_timers[idx] = setTimeout(function(){
        videoHoverEnd(div);
    }, 2500);
}

function videoHoverEnd(div) {
    var vid = div.find('video')[0];
    if(!vid.paused && !vid.ended) {
        div.removeClass("hovered");
    }
}

// FULLSCREEN -----------------------------------------------

function checkVideoFullscreen() {
    var isFullScreen = document.fullScreen ||
                   document.mozFullScreen ||
                   document.webkitIsFullScreen;

    if(!isFullScreen) {
        $('.elearnjs-video').removeClass("full");
    }
};

// BUTTONS --------------------------------------------------

var videoFullscreenPending = {};

function videoOnClick(div) {
    const dblclick_time = 250;
    var idx = $('.elearnjs-video').index(div);

    if(videoFullscreenPending[idx] == undefined
        || videoFullscreenPending[idx] === false) {
        videoFullscreenPending[idx] = true;
        // reset double click wait
        setTimeout(function() {
            // if still pending
            if(videoFullscreenPending[idx] === true) {
                videoTogglePlay(div);
                videoFullscreenPending[idx] = false;
            }
        }, dblclick_time);
    }
    else if(videoFullscreenPending[idx] === true){
        // reset
        videoFullscreenPending[idx] = false;
        videoToggleFullscreen(div);
    }
}

function videoTogglePlay(div) {
    var vid = div.find('video')[0];
    var btn = div.find('.playpause')[0];

    // paused now -> play
    if(vid.paused || vid.ended) {
        vid.play();
    }
    // pause
    else {
        vid.pause();
    }

    videoUpdatePlayPauseButton(div);
}

function videoUpdatePlayPauseButton(div) {
    var vid = div.find('video')[0];

    // paused now -> play
    if(vid.paused || vid.ended) {
        div.find('.playpause').attr("title", 'Play');
        div.find('.playpause').removeClass("playing");
        div.find('.playpause').addClass("paused");
        div.addClass("hovered");
    }
    // pause
    else {
        div.find('.playpause').attr("title", 'Pause');
        div.find('.playpause').addClass("playing");
        div.find('.playpause').removeClass("paused");
    }
}

function videoVolumeClick(div, e) {
    var vid = div.find('video')[0];
    var idx = $('.elearnjs-video').index(div);

    if(e.type === "touchend") {

    }
    else {
        if(vid.volume > 0) {
            video_volumes[idx] = vid.volume;
            vid.volume = 0;
        }
        else {
            vid.volume = video_volumes[idx];
        }
    }

    updateVideoVolume(div);
}

function updateVideoVolume(div) {
    var vid = div.find('video')[0];
    var btn = div.find('.volume');

    btn.removeClass("mute");
    btn.removeClass("low");
    btn.removeClass("medium");
    btn.removeClass("high");

    if(vid.volume == 0) {
        btn.addClass("mute");
    }
    else if(vid.volume < 0.33){
        btn.addClass("low");
    }
    else if(vid.volume < 0.66) {
        btn.addClass("medium");
    }
    else {
        btn.addClass("high");
    }
}

function videoVolumeHover(div) {
    // TODO
}


function videoToggleTimeleftDuration(div) {
    video_timestyle = (video_timestyle + 1) % 2;

    var timeleft_field = div.find('.timeleft');

    var title = "";
    switch(video_timestyle) {
        case video_timetypes.DURATION: title = "Duration"; break;
        case video_timetypes.TIMELEFT: title = "Time left"; break;
    }
    timeleft_field.attr("title", title);

    updateVideoTime(div);
}

function videoToggleFullscreen(div) {
    // to fullscreen
    if(!div.is(".full")) {
        var elem = div[0];
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.webkitEnterFullscreen) {
            elem.webkitEnterFullscreen();
        } else {
            elem = div.find('video')[0];
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.webkitEnterFullscreen) {
                elem.webkitEnterFullscreen();
            } else {
                alert('No Fullscreen Support.')
                return;
            }
            return;
        }
        div.addClass("full");
    }
    else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
        div.removeClass("full");
    }
}

// PROGRESSBAR ----------------------------------------------

var videoMouseDownTarget = null;
var videoMouseDown = false;
var videoPausedBefore = false;

function setVideoMouseDown(div, b) {
    var vid = div.find('video')[0];
    if(b) {
        videoMouseDownTarget = div;
        videoPausedBefore = vid.paused || vid.ended;
        vid.pause();
    }
    else {
        if(!videoPausedBefore) {
            videoMouseDownTarget = null;
            vid.play();
        }
    }
    videoMouseDown = b;
}

function videoProgressMouseEnter(div, e) {
    var con = div.find('.video-progress-con');
    var back = con.find('.video-progress');
    back.append('<div class="video-progress-hover">');
    div.append('<div class="progress-hover-time"></div>');
}

function videoProgressMouseLeave(div, e) {
    var con = div.find('.video-progress-con');
    con.find('.video-progress-hover').remove();
    div.find('.progress-hover-time').remove();
}

function videoProgressMouseMove(div, e) {
    var vid = div.find('video')[0];
    var pos = 0;
    if(e.type.toLowerCase() === "mousemove"
        || e.type.toLowerCase() === "mousedown") {
        pos = e.offsetX;
    }
    else if(e.type.toLowerCase() === "touchmove"
            || e.type.toLowerCase() === "touchstart"){
        pos = e.originalEvent.touches[0].clientX - $(e.target).offset().left;
    }

    if(pos < 0) pos = 0;
    if(pos > div.find('.video-progress').width()) pos = div.find('.video-progress').width();

    var pos_perc = pos / div.find('.video-progress').width();
    div.find('.video-progress-hover').css("width", pos_perc*100 + "%");

    if(videoMouseDown) {
        div.find('.video-progress-bar').css("width", pos_perc*100 + "%");
        vid.currentTime = vid.duration * pos_perc;
    }
    div.find('.progress-hover-time').html(timeToString(pos_perc * vid.duration));
    div.find('.progress-hover-time').css('left', pos + div.find('.video-progress-con')[0].offsetLeft);
    div.find('.progress-hover-time').css('margin-left', "-" + (div.find('.progress-hover-time').outerWidth() / 2) + "px");
}

// GENERAL VIDEO PLAYER -------------------------------------

function updateVideoTime(div) {
    var vid = div.find('video')[0];
    var time_field = div.find('.playtime');
    var timeleft_field = div.find('.timeleft');

    var time = vid.currentTime;
    var timeleft = Math.floor(vid.duration) - Math.floor(vid.currentTime);

    // time fields
    time_field.html(timeToString(time));
    if(video_timestyle === video_timetypes.TIMELEFT) timeleft_field.html("-" + timeToString(timeleft));
    else if(video_timestyle === video_timetypes.DURATION) timeleft_field.html(timeToString(vid.duration));


    // progress bar
    var progress_bar = div.find('.video-progress-bar');
    progress_bar.css("width", (vid.currentTime*100)/vid.duration + "%");

    // buffered bar
    var latest_end = 0;
    for(var i=0; i<vid.buffered.length; i++) {
        if(vid.buffered.end(i) > latest_end) {
            latest_end = vid.buffered.end(i);
        }
    }
    var buffered_perc = latest_end / vid.duration;
    div.find('.video-progress-loaded').css("width", buffered_perc*100 + "%");

    resizeVideoPlayer(div);
}


function timeToString(seconds) {
    seconds = Math.floor(seconds);
    var hours = Math.floor(seconds / (60*60));
    seconds -= hours*60*60;
    var minutes = Math.floor(seconds / 60);
    seconds -= minutes*60;

    var time_str = seconds;
    if(seconds < 10) {
        time_str = "0" + time_str;
    }
    time_str = minutes + ":" + time_str;
    if(hours > 0) {
        if(minutes < 10) {
                time_str = "0" + time_str;
        }
        time_str = hours + ":" + time_str;
    }

    return time_str;
}

function resizeAllVideoPlayers() {
    $('.elearnjs-video:visible').each(function(i,e) {
        resizeVideoPlayer($(this));
    });
}


function resizeVideoPlayer(div) {
    if(isTouchSupported()) div.addClass("mobile");

    // check text field sizes
    var time_field = div.find('.playtime');
    var timeleft_field = div.find('.timeleft');

    if(time_field.width() > parseFloat(time_field.css("min-width").replace("px", ""))+1) {
        var min_width = time_field.width() + 10;
        time_field.css("min-width", min_width + "px");
    }
    if(timeleft_field.width() > parseFloat(timeleft_field.css("min-width").replace("px", ""))+1) {
        var min_width = timeleft_field.width() + 10;
        timeleft_field.css("min-width", min_width + "px");
    }

    // calculate progress bar width
    var icon_width = 0.0;

    div.find('.controls').children(':visible').each(function(i,e) {
        if(!$(this).is('.video-progress-con')) {
            icon_width += $(this).outerWidth(true);
        }
    });

    var progress_width = div.find('.controls').width() - icon_width - 5
                        - parseInt(div.find('.video-progress-con').css("margin-left").replace("px", ""))
                        - parseInt(div.find('.video-progress-con').css("margin-right").replace("px", ""));
    div.find('.video-progress-con').css("width", progress_width + "px");
}


// ----------------------------------------------------------------------------
// ------------------------- GENERAL ------------------------------------------
// ----------------------------------------------------------------------------

/**
* Zeigt die vorherige Section
* Funktioniert nur, wenn nicht alle Sections angezeigt werden.
*/
function showPrev() {
    var ret = showSection(visSection-1);
    // Ausführen registrierten funktionen
    if(ret) {
        $.each(afterPageInteraction, function(key, fnc) {
            fnc();
        });
    }
};

/**
* Zeigt die nächste Section
* Funktioniert nur, wenn nicht alle Sections angezeigt werden.
*/
function showNext() {

    // nur wenn entweder nicht blockiert bei unbeantworteter Frage
    // oder alle (sichtbaren) Fragen beantwortet
    if(!checkBlockProgress()) {
        var ret = showSection(visSection+1);
        // Ausführen registrierten funktionen
        if(ret) {
            $.each(afterPageInteraction, function(key, fnc) {
                fnc();
            });
        }
    }
};

function overviewShowSection(i) {
    var ret = showSection(i);

    // Ausführen registrierten funktionen
    if(ret) {
        $.each(afterPageInteraction, function(key, fnc) {
            fnc();
        });
    }
}

/**
* Zeigt eine bestimmte Section (nach Index)
* Funktioniert nur, wenn nicht alle Sections angezeigt werden.
*/
function showSection(i) {
    overviewShown = true;
    showSectionOverview();

    // get section to name
    if(typeof i === 'string' || i instanceof String) {
        i = $('section').index($('section[name="' + i + '"]').get(0));
    }

    // show only this section
    if(!allShown && i >= 0 && i < $('section').length) {
        $('section').hide();

        $($('section')[i]).show();

        var topPos = $($('section')[i]).position().top - $('#navigation').height() - 10;
        if($(document).scrollTop() > topPos) {
            $(document).scrollTop(topPos);
        }

        $('#nav-title').text($($('section')[i]).attr('name'));
        allShown = false;
        calcProgress(i);
    }
    // scroll to that section
    else if(allShown) {
        var topPos = $($('section')[i]).position().top - $('#navigation').height();
        $(document).scrollTop(topPos);
    }
    else {
        return false;
    }


    // section was updated
    if(i >= 0 && i < $('section').length) {
        visSection = i;
        updateContentOverview();
        stopVideos();
    }

    if(!allShown) {
        setDirectionButtonsEnabledIdx(visSection);
    }

    // Ausführen registrierten funktionen
    $.each(afterShow, function(key, fnc) {
        fnc();
    });

    return true;
};

/**
* Registriert eine Funktion, die ausgeführt wird, nachdem eine neue Section
* angezeigt wurde.
*/
function registerAfterShow(key, fnc) {
    afterShow[key] = fnc;
}

/**
* Registriert eine Funktion, die ausgeführt wird, nachdem eine neue Section
* angezeigt wurde.
*/
function registerAfterPageInteraction(key, fnc) {
    afterPageInteraction[key] = fnc;
}

/**
* Registriert eine Funktion, die ausgeführt wird, nachdem eine neue Section
* angezeigt wurde.
*/
function registerAfterTabChange(key, fnc) {
    afterTabChange[key] = fnc;
}

function pushHistoryState() {
    if(!allShown) {
        try {
            if(window.history.state == undefined
                || (window.history.state.p != undefined
                    && window.history.state.p != null
                    && window.history.state.p != visSection)) {
                window.history.pushState({p: visSection}, "State", "?p="+visSection);
            }
        } catch (e) {

            //window.location = "?p="+visSection;
        }
    }
}

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
function toggleAllSections() {
    setDirectionButtonsEnabled(allShown);
    setProgressbarEnabled(allShown);
    $('#nav-title').text(navigationTitle);

    if(allShown) {
        allShown = false;
        showSection(visSection);
    }
    else {
        $('section').show();
        $(document).scrollTop($($('section')[visSection]).position().top - $('#navigation').height() - 10);
        allShown = true;
        resizeAllSliders();
        // Ausführen registrierten funktionen
        $.each(afterShow, function(key, fnc) {
            fnc();
        });
    }
};

/**
* Aktiviert oder deaktiviert generell Richtungsknöpfe.
* Zum manuellen aktivieren oder deaktivieren durch den Ersteller der Seite
*/
function generalDirectionButtonsEnabled(b) {
    if(b) {
        setDirectionButtonsEnabledIdx(visSection);
    }
    else {
        setDirectionButtonsEnabled(false);
    }
    dirButtonsEnabled = b;
}

/**
* Aktiviert die Frage vor und zurück Buttons wenn b == true. deaktiviert sie sonst.
*/
function setDirectionButtonsEnabled(b) {
    if(dirButtonsEnabled) {
        if(b) {
            $('#btnPrev').show();
            $('#btnNext').show();
        }
        else {
            $('#btnPrev').hide();
            $('#btnNext').hide();
        }
    }
};

/**
* Aktiviert die Frage vor und zurück Buttons je nach Index.
*/
function setDirectionButtonsEnabledIdx(i) {
    if(dirButtonsEnabled) {
        $('#btnPrev').show();
        $('#btnNext').show();
        if(i == 0 || overviewShown) {
            $('#btnPrev').hide();
        }
        if(i == ($('section').length - 1) || overviewShown) {
            $('#btnNext').hide();
        }
    }
}


/**
* Generelles aktivieren/deaktivieren der Fortschrittsleiste
*/
function generalProgressbarEnabled(b) {
    setProgressbarEnabled(b);
    progressbarEnabled = b;
}

/**
* Aktiviert die Progressbar wenn b == true. deaktiviert sie sonst.
*/
function setProgressbarEnabled(b) {
    if(progressbarEnabled) {
        if(b) {
            $('#progressback').show();
            $('.menu-wrap').css('top', $('#navigation').height() + "px");
            $('.section-overview').css('top', $('#nav-bar').outerHeight() + "px");
            $('.section-overview').css('height', "calc(100% - " + $('.section-overview').css("top") + ")");
        }
        else {
            $('#progressback').hide();
            $('.menu-wrap').css('top', $('#navigation').height() + "px");
            $('.section-overview').css('top', $('#nav-bar').outerHeight() + "px");
            $('.section-overview').css('height', "calc(100% - " + $('.section-overview').css("top") + ")");
        }
    }
};


/**
* Aktiviert oder deaktiviert das Blocken des Weitergehens (in showNext())
*/
function setBlockProgressIfQuestionsNotAnswered(b) {
    blockProgressQuizJS = b;
}

/**
* Gibt zurück ob der Fortschritt geblockt werden soll.
* Zeigt außerdem Blocknachrichten an.
*/
function checkBlockProgress() {
    var block = blockProgressQuizJS && !getVisibleQuestionsAnswered();

    if(block) {
        // Zeigt alert
        if(blockProgressAlertActivated) {
            alert(blockProgressAlertText);
        }

        // zeigt gesetztes Element an
        if(blockProgressShowElementActivated) {
            $(blockProgressShowElementText).show();
        }
    }
    else {
        // blendet gesetztes Element wieder aus
        if(blockProgressShowElementActivated) {
            $(blockProgressShowElementText).hide();
        }
    }

    return block;
}

/**
* Aktiviert oder deaktiviert einen Alert im Blockfall und setzt ggf. die
* Nachricht die angezeigt wird.
*/
function setBlockProgressAlert(enabled, text) {
    blockProgressAlertActivated = enabled;
    blockProgressAlertText = text;
}


function setBlockProgressShowElement(enabled, text) {
    blockProgressShowElementActivated = enabled;
    blockProgressShowElementText = text;
}



// -------------------------------------------------------------------------------------
// Overview
// -------------------------------------------------------------------------------------

var sectionsVisited = [];

/**
* Erstellt ein Inhaltsverzeichnis. Wird #content-overview hinzugefügt.
*/
function createContentOverview() {
    if($('#content-overview').length > 0) {
        var text = "<ul>";
        var level = 0;
        var levels = {
            SUB : 1,
            SUBSUB : 2
        };

        for(var i=0; i<$('section').length; i++) {

            var sec = $($('section')[i]);

            if(sec.is('.hide-in-overview')) continue;

            var sec_level = 0;
            if(sec.is('.sub')) sec_level = levels.SUB;
            if(sec.is('.subsub')) sec_level = levels.SUBSUB;

            if($('#content-overview').is('.kachel')) {
                // es kann nur eine ebenen zur zeit geöffnet werden
                // aufgrund der Schachtelung in li's einzige logische Variante
                if(level < sec_level) {
                    // ende des li zum schachteln entfernen
                    text = text.substring(0, text.length - 5);
                    text += "<ul>\r\n";
                    level++;
                }
                // mehrere ebenen können gleichzeitig beendet werden
                while(level > sec_level) {
                    text += "</ul></li>\r\n";
                    level--;
                }
            }
            // listenansicht
            else {
                // higher level
                while(level < sec_level) {
                    text += "<ul>";
                    level++;
                }
                // lower level
                while(level > sec_level) {
                    text += "</ul>";
                    level--;
                }
            }

            text += "<li onclick='overviewShowSection("+i+"); event.stopPropagation();'>";

            text += "<div class='sectionRead'><div class='img'></div></div>";
            text += "<span class='title'>" + sec.attr('name') + "</span>";
            if(sec.attr('desc') != undefined
                && sec.attr('desc').length > 0) {
                text += "<p>" + sec.attr('desc') + "</p>";
            }

            text += "</li>";

            sectionsVisited.push(false);
        }
        // close all open ul's
        while(level >= 0) {
            text+="</ul>";
            level--;
        }

        $('#content-overview').html(text);
        $('#content-overview').find('li').each(function(i,e) {
            if($(this).children('ul').length != 0) {
                $(this).addClass("wide");
            }
        });
        $('#content-overview').find("a").click(function(e) {
            e.preventDefault();
        });
    }
}


function updateContentOverview() {
    sectionsVisited[visSection] = true;
    var li_idx = 0;
    for(var i=0; i<$('section').length; i++) {

        if($('section').eq(i).is('.hide-in-overview')) {
            continue;
        }

        if(sectionsVisited[i] && !$('#content-overview').is('.hide-read')) {
            $($('#content-overview').find('li').get(li_idx)).children('.sectionRead').first().addClass('read');
        }
        else {
            $($('#content-overview').find('li').get(li_idx)).children('.sectionRead').first().removeClass('read');
        }

        li_idx++;
    }
}


var justOpenedOverview = false;
/**
* Erstellt ein Inhaltsverzeichnis. (Für die Nav-Leiste)
*/
function createSectionOverview() {
    var text = "<div>";

    for(var i=0; i<$('section').length; i++) {
        var sec = $($('section')[i]);
        var cls = "";
        if(sec.is('.sub')) cls=" sub";
        if(sec.is('.subsub')) cls=" subsub";

        text += "<label><div class='section-overview-element btn"+cls+"' onclick='overviewShowSection("+i+");'>"
                    + sec.attr('name')
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
        $('#btnExpSym').removeClass("mirrorY");
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
        $('.section-overview').find(".section-overview-element").removeClass("active");
        $($('.section-overview').find(".section-overview-element")[visSection]).addClass("active");
        $('#btnExpSym').addClass("mirrorY");
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
        && !$(e.target).is("#btnExp *")
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
* Initialisiert den footer des Info Bereichs.
*/
function initiateInfo() {
    $('#info').find('.lightbox').append('<div class="elearn-info">'
        + 'Benutzt das eLearn.js Script Version ' + VERSION_NR + ' | ' + VERSION_DATE + '. '
        + '<br>'
        + '<span xmlns:dct="http://purl.org/dc/terms/" property="dct:title">elearn.js Template</span> '
        + 'von <span xmlns:cc="http://creativecommons.org/ns#" property="cc:attributionName">Universität Hamburg</span> '
        + 'ist lizenziert unter einer <a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">'
        + 'Creative Commons Namensnennung</a> - Weitergabe unter gleichen Bedingungen 4.0 International Lizenz'
        + '<br>'
        + '<a href="https://www.min.uni-hamburg.de/de/imprint.html">Impressum</a>'
        + '</div>');
    $('#info').find('.lightbox').append("<div class='support'><small>Dieses "
        + "Vorhaben wird innerhalb "
        + "des gemeinsamen Bund-Länder-Programms für bessere Studienbedingungen "
        + "und mehr Qualität in der Lehre aus Mitteln des Bundesministerium für "
        + "Bildung und Forschung unter dem Förderkennzeichen 01PL12033 "
        + "gefördert. Die Verantwortung für den Inhalt dieser Veröffentlichung "
        + "liegt bei den Autor/-innen.</small>"
        + '<img src="assets/img/logo-bmbf.gif" alt="Logo vom Bundesministerium für Bildung und Forschung">'
        + '<div style="clear: both;">'
        + '<a href="http://www.uni-hamburg.de" target="_blank"><img src="assets/img/logo-uhh.gif" alt="Logo der Universität Hamburg" style="padding:1em 1em 2em 1em;"></a>'
        + "</div>");
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


/**
* Herunterladen der zip Datei download.zip
*/
function startDownload(url) {
    window.open(url,'_blank');
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
        var x = ul.children('li').outerWidth(true)*slide*-1;
        if(ul.parent().filter('.slider-nav').length > 0) {
            x = ul.children('li').outerWidth(true)*slide*-4;
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
//                         height += $(ul.children('li')[visibleImage[ul_id]]).children('p').height();
//                     }
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

var resizeTimer = null;

/**
* Passt alle Slider und auch das Zoom Fenster an die Fenstergröße des Browsers
* an.
*/
function resizeAllSliders() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        $('ul.img-gallery').css("transition-duration", "0s");
        resizeSliders();
        resizeNavigationSliders();
        resizeZoomContainer();
    }, 150);

}

/**
* Passt alle Bildergallerien (normalen Slider) an neue Fenstergröße an.
*/
function resizeSliders() {
    $('.slider:visible').each(function() {
        var slider = $(this);
        var ul = slider.children('ul.img-gallery');
        ul.find('img').css({'max-height': ''});
        var slide = visibleImage[$('.img-gallery').index(ul)];
        var heights = 0;
        var testedImages = 0;
        slider.children('ul.img-gallery').children('li').each(function(i, e) {
            var li = $(this);
            li.css("width", slider.width() + "px");
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
                        if(slider.css("max-height") != "none") {
                            heights = Math.min(heights, slider.css("max-height").replace("px", ""));
                        }
                        ul.children('li').css('height', heights + "px");
                        slider.css("height", heights + "px");
                    }
                }
                else {
                    var maxHeight = height + "px";
                    if(height > parseFloat(ul.css("max-height").replace("px", "")) && ul.css("max-height") != "none" ) {
                        maxHeight = ul.css("max-height");
                    }
                    if(height > parseFloat(slider.css("max-height").replace("px", "")) && slider.css("max-height") != "none" ) {
                        maxHeight = slider.css("max-height");
                    }
                    li.css("height", maxHeight);
                    if(i == slide) {
                        //if(li.children('p').length > 0) {
                        //    maxHeight = height + li.children('p').height() + "px";
                        //}
                        slider.css("height", maxHeight);
                    }
                }
                li.children('img').css('max-height', '100%');
            });
        });
        var x = ul.children('li').outerWidth(true)*slide*-1;
        ul.css({
            width: ul.children('li').outerWidth(true) * ul.children('li').length + "px",
            transform: "translate3d(" + x + "px, 0px, 0px)"
        });
    });
}

/**
* Passt alle Slider Navigationen an neue Fenstergröße an.
*/
function resizeNavigationSliders() {
    $('.slider-nav:visible').each(function() {
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
        var x = ul.children('li').outerWidth(true)*slide*-4;
        ul.css({
            width: ul.children('li').outerWidth(true) * (ul.children('li').length) + "px",
            height: liHeight + "px",
            transform: "translate3d(" + x + "px, 0px, 0px)"
        });
        // Set Image Size
        var alerted = false;
        // Zur korrekten größen Berechnung muss das zurückgesetzt werden.
        ul.children('li').find('img').css({"width":"", "height":""});
        ul.children('li').find('img').each(function(i,e) {
            var img = $(this);
            getImageSize(img, function(width, height){
                if(liHeight > 0) {
                    var ratio = width/height;
                    if(ratio > 4/3) {
                        var newWidth = (liHeight * ratio);
                        var leftPx = liWidth/2 - newWidth/2;
                        img.css("height", "100%");
                        img.css("width", 75*ratio + "%");
                        img.css("left", leftPx + "px");
                        img.css("top", "");
                    }
                    else if(ratio < 4/3) {
                        img.css("width", "100%");
                        var topPx = liHeight/2 - (liWidth * (1/ratio))/2;
                        img.css("height", "");
                        img.css("left", "");
                        img.css("top", topPx + "px");
                    }
                }
            });
        });
        slider.css("height", liHeight + "px");
    });
}

/**
* Passt Zoom Container an neue Fenstergröße an.
*/
function resizeZoomContainer() {
    if($('.image-zoom-container:visible').is(':visible')) {
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
var tooltips = ['<div id="tooltipBack" class="tooltip fixed">'
                + 'Verlinkt normalerweise auf eine <br>vorangegane Seite oder den Anfang <br>des Dokuments.'
                + '</div>',
                '<div id="tooltipShowAll" class="tooltip fixed">'
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
                + '</div>',
                '<div id="tooltipArrowRight" class="tooltip fixed right">'
                + 'Wischen, um auf die nächste Seite zu wechseln.'
                + '</div>',
                '<div id="tooltipArrowLeft" class="tooltip fixed left">'
                + 'Wischen, um auf die vorherige Seite zu wechseln.'
                + '</div>'];

var ttMaxWidth = [-1, -1, -1, -1, 440, 440, -1, -1];
var ttMinWidth = [-1, -1, -1, -1, -1, -1, -1, -1];
// in bedingung muss entweder eine Funktion die ein bool returned stehen oder direkt ein bool
var bedingung = [isBackButtonEnabled, true, true, true, true, true, isTouchSupported, isTouchSupported];
var anchor = ["#btnBack", "#btnAll", "#btnExp", "#btnMenu", "#btnNext", "#btnPrev", "#btnNext", "#btnPrev"];
var positions = ["#btnBack", "#btnAll", "#btnExp", "#btnMenu", [0,0], [0,0], [0,0], [0,0]];

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
    if((ttMaxWidth[nr] < 0 || $(window).width() > ttMaxWidth[nr])
        && (ttMinWidth[nr] < 0 || $(window).width() <= ttMinWidth[nr])
        && (isFunction(bedingung[nr]) ? bedingung[nr]() : bedingung[nr])
        && $(anchor[nr]).is(":visible")) {
        if(typeof positions[nr] == 'string' && !$(positions[nr]).is(':visible')) {
            nextTooltip();
            return;
        }
        if(typeof positions[nr] == 'string') {
            if($($('.tooltip')[nr]).is(".right")) {
                setTooltipPosition(nr, true,
                                $(positions[nr]).offset().top
                                - $(document).scrollTop()
                                + parseInt($(positions[nr]).css("margin-top").replace(/\D/g, "")) + 38,
                                $('#wrap').width()
                                - ($(positions[nr]).offset().left
                                 + parseInt($(positions[nr]).css("margin-left").replace(/\D/g, ""))
                                 - $('#wrap').offset().left) - 40);
            }
            else {
                setTooltipPosition(nr, false,
                                $(positions[nr]).offset().top
                                - $(document).scrollTop()
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
// Hideables
// --------------------------------------------------------------------------------------

function initiateHideables() {
    $('.hideable').each(function() {
        var div = $(this);
        div.wrap('<div class="hideable-container"></div>');
        div.before('<button onclick="toggleHideable(this);">'
                        + div.attr('show') + " " + div.attr('name')
                        + '</button>');

        div.hide();
    });
}

function toggleHideable(element) {
    var div = $(element).nextAll().first('.hideable');

    // hide
    if(div.is(':visible')) {
        div.hide();
        $(element).html(div.attr('show') + " " + div.attr('name'));
    }
    // show
    else {
        div.show();
        $(element).html(div.attr('hide') + " " + div.attr('name'));
    }
}

// --------------------------------------------------------------------------------------
// Tabbed boxes
// --------------------------------------------------------------------------------------

function initiateTabbedBoxes() {
    $('.tabbed-box').each(function() {
        var div = $(this);

        div.wrap('<div class="tabbed-container"></div>');

        div.before('<div class="tabs"></div>');

        var tabs = div.parent().find('.tabs');

        div.find('.tab').each(function() {
            var tab = $(this);
            tabs.append('<div class="tab-select" onclick="selectTab(this);">'
                            + tab.attr('name')
                            + '</div>');
        });

        // set active tab to first
        div.find('.tab').hide();
        div.find('.tab').first().show();
        tabs.find('.tab-select').first().addClass('act');

        registerAfterTabChange("slider-resize", resizeAllSliders);
    });
}

function selectTab(element) {
    var e = $(element);
    var div = e.parent().nextAll().first('.tabbed-box');

    // show only new
    div.find('.tab').hide();
    div.find('.tab').filter('[name="' + e.html() + '"]').show();
    e.parent().find('.tab-select').removeClass("act");
    e.addClass("act");

    // Ausführen registrierten funktionen
    $.each(afterTabChange, function(key, fnc) {
        fnc();
    });
}


// --------------------------------------------------------------------------------------
// Hover Infos
// --------------------------------------------------------------------------------------

function initiateHoverInfos() {
    $('.hover-info').each(function() {
        var div = $(this);

        var title = div.clone().children().remove().end().html();
        var children = div.clone().children();

        div.html("");
        div.append("<div class='title'>" + title + "</div>");
        div.append(children);

        title = div.children('.title');
        title.append('<span class="icon-info">');

        var info = div.children('div').last();
        info.addClass("hide");
        info.addClass("hover-info-block");

        div.on('mouseenter', function(event) {
            if(!isTouchSupported())
                hoverInfoShow(div);
        });
        div.on('mouseleave', function(event) {
            hoverInfoHide(div);
        });
        title.on('click', function(event) {
            hoverInfoTrigger(div);
        });
    });
}

function hoverInfoSetPositions() {
    $('.hover-info').each(function() {
        hoverInfoSetPosition($(this));
    });
}

function hoverInfoSetPosition(div) {
    const min_width = 200;
    const perc_from = 400;

    var width = 0;
    if(div.closest('section').width() > perc_from) {
        width = div.closest('section').width() * 0.5;
    }
    else if(div.closest('section').width() < min_width){
        width = min_width;
    }
    else {
        var fact = 1 - ((div.closest('section').width() - min_width) / ((perc_from - min_width)*2));
        width = div.closest('section').width() * fact;
    }

    var left = "auto";
    var right = "auto";
    if(($(window).width() - div.offset().left)
            > (div.offset().left + div.outerWidth(true))) {
        left = div.offset().left;
        margin = "0 1em 0 0";
    }
    else {
        right = $(window).width() - div.offset().left - div.outerWidth(true);
        margin = "0 0 0 1em";
    }

    var parent = div.closest('section');

    var info = div.children('div.hover-info-block');

    info.css({
        "top": div.offset().top + div.outerHeight(true),
        "left": left,
        "right": right,
        "margin": margin,
        "max-width": width
    });
}

function hoverInfoShow(div) {
    var info = div.children('div.hover-info-block');
    info.removeClass("hide");

    hoverInfoSetPosition(div);
}

function hoverInfoHide(div) {
    var info = div.children('div.hover-info-block');
    info.addClass("hide");
}

function hoverInfoTrigger(div) {
    var info = div.children('div.hover-info-block');
    if(info.is('.hide')) {
        hoverInfoShow(div);
    }
    else {
        hoverInfoHide(div);
    }
}

// --------------------------------------------------------------------------------------
// Stop Videos
// --------------------------------------------------------------------------------------

/**
* Stops all videos on the page. Usually called when another section is displayed.
*/
function stopVideos() {
    // stop all HTML5 videos
    $('video').each(function() {this.pause()});
    $('audio').each(function() {this.pause()});

    /*
    // set hsrc from src and set src to "" so the video stops
    // cannot be reset directly because it only loads if visible.
    $('.strobemediaplayback-video-player').not(':visible').each(function() {

        // if not set already
        if($(this).attr("hsrc") == undefined
            || $(this).attr("hsrc") == null
            || $(this).attr("hsrc").length == 0)
        {
            $(this).attr("hsrc", this.src);
            this.src = "";
        }
    });

    // reload sources for every lecture2go video
    // set source from hsrc (hidden source, set below)
    $('.strobemediaplayback-video-player:visible').each(function() {
        if($(this).attr("hsrc") != undefined
            && $(this).attr("hsrc") != null
            && $(this).attr("hsrc").length > 0)
        {
            this.src = $(this).attr("hsrc");
            $(this).attr("hsrc", "");
        }
    });
    */
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
        resizeAllVideoPlayers();
        $('#sideMenu').css('right', "-"+($('#sideMenu').width()+10)+"px");
    }, 250);
    updateNavBarWidth();
    hoverInfoSetPositions();
});

// --------------------------------------------------------------------------------------
// KeyPress Part (Arrow Left/Right)
// --------------------------------------------------------------------------------------
/**
* Fügt Pfeiltastennavigation durch Sections hinzu.
*/
$(document).keydown(function(e){
    if(!allShown && keyNavigationEnabled) {
        if(e.keyCode == 37) {
            showPrev();
        }
        else if(e.keyCode == 39) {
            showNext();
        }
    }
});


/**
* Aktiviert oder Deaktiviert Tastaturnavigation
*/

function setKeyNavigationEnabled(b) {
    keyNavigationEnabled = b;
}



/**
* Überprüft ob eine URL existiert.
* @param url : URL als String (inkl. http:// )
* @param callback : function(exists) {...}
*   wird aufgerufen, nachdem die Funktion abgeschlossen ist.
*/
function doesURLExist(url, callback) {
    $.ajax({
        url: url,
        type:'HEAD',
        error: function()
        {
            callback(false);
        },
        success: function()
        {
            callback(true);
        }
    });
}

/**
* Checks if an object is a function
*/
function isFunction(functionToCheck) {
 var getType = {};
 return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}


function getOuterWidth(e, outer) {
    var element = e[0];
    var rect = element.getBoundingClientRect();

    var width;
    if (rect.width) {
      // `width` is available for IE9+
      width = rect.width;
    } else {
      // Calculate width for IE8 and below
      width = rect.right - rect.left;
    }

    if(outer) {
        var style = element.currentStyle || window.getComputedStyle(element);
        var margin = parseFloat(style.marginLeft) + parseFloat(style.marginRight);
        width += margin;
    }

    return width;
}

// --------------------------------------------------------------------------------------
// Touch Scroll part
// --------------------------------------------------------------------------------------


var maxDiff = 0;
var clickedAlready = false;

function isTouchSupported() {
    return touchSupported;
}

/**
* Fügt allen Sections eine Touchabfrage hinzu.
*/
function addTouchToSections() {
    $(document).bind('touchstart', function() {
        touchSupported = true;
        touchStart(event, this);
    });
    $(document).bind('touchend', function() {
        touchEnd(event);
    });
    $(document).bind('touchmove', function() {
        touchMove(event);
    });
    $(document).bind('touchcancel', function() {
        touchCancel(event);
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
var startScrollLeft = 0;

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
    // else if($(window).width() - (event.touches[0].pageX - $(document).scrollLeft()) < 20 && !isSideMenuVisible()) {
        // swipeType = "menu";
        // $('.menu-wrap').css('top', $('#navigation').height() + "px");
    // }
    else if(isSideMenuVisible()) {
        swipeType = "menu-back";
        $('.menu-wrap').css('top', $('#navigation').height() + "px");
    }
    else if(!allShown
        && !swipeTarget.is("code") // Kein Code Element
        && (parseInt(swipeTarget.prop("scrollWidth")) <= Math.ceil(swipeTarget.innerWidth())
            || swipeTarget.css("overflow-x") == 'hidden')) // Element nicht horizontal scrollbar
    {
        swipeType = "section";
    }
    else {
        swipeType = "normal";
    }
}

function touchStart(event,passedName) {
    swipeTarget = $(event.target);
    setSwipeType();

    startScrollLeft = $(document).scrollLeft();

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

        if((isHorizontalSwipe && swipeType != "section" && swipeType != "normal")
            || (isHorizontalSwipe && swipeType == "section" && Math.abs(lastDif) > 12)) {
            event.preventDefault();
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
        startScrollLeft = 0;
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
    return;
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
    var x = parseFloat(-vimg*$(swipeTarget).children("li").outerWidth(true));
    if(ul.parent().is('.slider-nav')) {
        x = parseFloat(-4*vimg*$(swipeTarget).children("li").outerWidth(true));
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




//
var QueryString = function () {
  // This function is anonymous, is executed immediately and
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = pair[1];
    // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = arr;
    // If third or later entry with this name
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  }
    return query_string;
} ();


// --------------------------------------------------------------------------------------
// QR Code
// --------------------------------------------------------------------------------------

// Jquery QRCode Generation. Minified.
// from: http://jeromeetienne.github.io/jquery-qrcode/

(function(r){r.fn.qrcode=function(h){var s;function u(a){this.mode=s;this.data=a}function o(a,c){this.typeNumber=a;this.errorCorrectLevel=c;this.modules=null;this.moduleCount=0;this.dataCache=null;this.dataList=[]}function q(a,c){if(void 0==a.length)throw Error(a.length+"/"+c);for(var d=0;d<a.length&&0==a[d];)d++;this.num=Array(a.length-d+c);for(var b=0;b<a.length-d;b++)this.num[b]=a[b+d]}function p(a,c){this.totalCount=a;this.dataCount=c}function t(){this.buffer=[];this.length=0}u.prototype={getLength:function(){return this.data.length},
write:function(a){for(var c=0;c<this.data.length;c++)a.put(this.data.charCodeAt(c),8)}};o.prototype={addData:function(a){this.dataList.push(new u(a));this.dataCache=null},isDark:function(a,c){if(0>a||this.moduleCount<=a||0>c||this.moduleCount<=c)throw Error(a+","+c);return this.modules[a][c]},getModuleCount:function(){return this.moduleCount},make:function(){if(1>this.typeNumber){for(var a=1,a=1;40>a;a++){for(var c=p.getRSBlocks(a,this.errorCorrectLevel),d=new t,b=0,e=0;e<c.length;e++)b+=c[e].dataCount;
for(e=0;e<this.dataList.length;e++)c=this.dataList[e],d.put(c.mode,4),d.put(c.getLength(),j.getLengthInBits(c.mode,a)),c.write(d);if(d.getLengthInBits()<=8*b)break}this.typeNumber=a}this.makeImpl(!1,this.getBestMaskPattern())},makeImpl:function(a,c){this.moduleCount=4*this.typeNumber+17;this.modules=Array(this.moduleCount);for(var d=0;d<this.moduleCount;d++){this.modules[d]=Array(this.moduleCount);for(var b=0;b<this.moduleCount;b++)this.modules[d][b]=null}this.setupPositionProbePattern(0,0);this.setupPositionProbePattern(this.moduleCount-
7,0);this.setupPositionProbePattern(0,this.moduleCount-7);this.setupPositionAdjustPattern();this.setupTimingPattern();this.setupTypeInfo(a,c);7<=this.typeNumber&&this.setupTypeNumber(a);null==this.dataCache&&(this.dataCache=o.createData(this.typeNumber,this.errorCorrectLevel,this.dataList));this.mapData(this.dataCache,c)},setupPositionProbePattern:function(a,c){for(var d=-1;7>=d;d++)if(!(-1>=a+d||this.moduleCount<=a+d))for(var b=-1;7>=b;b++)-1>=c+b||this.moduleCount<=c+b||(this.modules[a+d][c+b]=
0<=d&&6>=d&&(0==b||6==b)||0<=b&&6>=b&&(0==d||6==d)||2<=d&&4>=d&&2<=b&&4>=b?!0:!1)},getBestMaskPattern:function(){for(var a=0,c=0,d=0;8>d;d++){this.makeImpl(!0,d);var b=j.getLostPoint(this);if(0==d||a>b)a=b,c=d}return c},createMovieClip:function(a,c,d){a=a.createEmptyMovieClip(c,d);this.make();for(c=0;c<this.modules.length;c++)for(var d=1*c,b=0;b<this.modules[c].length;b++){var e=1*b;this.modules[c][b]&&(a.beginFill(0,100),a.moveTo(e,d),a.lineTo(e+1,d),a.lineTo(e+1,d+1),a.lineTo(e,d+1),a.endFill())}return a},
setupTimingPattern:function(){for(var a=8;a<this.moduleCount-8;a++)null==this.modules[a][6]&&(this.modules[a][6]=0==a%2);for(a=8;a<this.moduleCount-8;a++)null==this.modules[6][a]&&(this.modules[6][a]=0==a%2)},setupPositionAdjustPattern:function(){for(var a=j.getPatternPosition(this.typeNumber),c=0;c<a.length;c++)for(var d=0;d<a.length;d++){var b=a[c],e=a[d];if(null==this.modules[b][e])for(var f=-2;2>=f;f++)for(var i=-2;2>=i;i++)this.modules[b+f][e+i]=-2==f||2==f||-2==i||2==i||0==f&&0==i?!0:!1}},setupTypeNumber:function(a){for(var c=
j.getBCHTypeNumber(this.typeNumber),d=0;18>d;d++){var b=!a&&1==(c>>d&1);this.modules[Math.floor(d/3)][d%3+this.moduleCount-8-3]=b}for(d=0;18>d;d++)b=!a&&1==(c>>d&1),this.modules[d%3+this.moduleCount-8-3][Math.floor(d/3)]=b},setupTypeInfo:function(a,c){for(var d=j.getBCHTypeInfo(this.errorCorrectLevel<<3|c),b=0;15>b;b++){var e=!a&&1==(d>>b&1);6>b?this.modules[b][8]=e:8>b?this.modules[b+1][8]=e:this.modules[this.moduleCount-15+b][8]=e}for(b=0;15>b;b++)e=!a&&1==(d>>b&1),8>b?this.modules[8][this.moduleCount-
b-1]=e:9>b?this.modules[8][15-b-1+1]=e:this.modules[8][15-b-1]=e;this.modules[this.moduleCount-8][8]=!a},mapData:function(a,c){for(var d=-1,b=this.moduleCount-1,e=7,f=0,i=this.moduleCount-1;0<i;i-=2)for(6==i&&i--;;){for(var g=0;2>g;g++)if(null==this.modules[b][i-g]){var n=!1;f<a.length&&(n=1==(a[f]>>>e&1));j.getMask(c,b,i-g)&&(n=!n);this.modules[b][i-g]=n;e--; -1==e&&(f++,e=7)}b+=d;if(0>b||this.moduleCount<=b){b-=d;d=-d;break}}}};o.PAD0=236;o.PAD1=17;o.createData=function(a,c,d){for(var c=p.getRSBlocks(a,
c),b=new t,e=0;e<d.length;e++){var f=d[e];b.put(f.mode,4);b.put(f.getLength(),j.getLengthInBits(f.mode,a));f.write(b)}for(e=a=0;e<c.length;e++)a+=c[e].dataCount;if(b.getLengthInBits()>8*a)throw Error("code length overflow. ("+b.getLengthInBits()+">"+8*a+")");for(b.getLengthInBits()+4<=8*a&&b.put(0,4);0!=b.getLengthInBits()%8;)b.putBit(!1);for(;!(b.getLengthInBits()>=8*a);){b.put(o.PAD0,8);if(b.getLengthInBits()>=8*a)break;b.put(o.PAD1,8)}return o.createBytes(b,c)};o.createBytes=function(a,c){for(var d=
0,b=0,e=0,f=Array(c.length),i=Array(c.length),g=0;g<c.length;g++){var n=c[g].dataCount,h=c[g].totalCount-n,b=Math.max(b,n),e=Math.max(e,h);f[g]=Array(n);for(var k=0;k<f[g].length;k++)f[g][k]=255&a.buffer[k+d];d+=n;k=j.getErrorCorrectPolynomial(h);n=(new q(f[g],k.getLength()-1)).mod(k);i[g]=Array(k.getLength()-1);for(k=0;k<i[g].length;k++)h=k+n.getLength()-i[g].length,i[g][k]=0<=h?n.get(h):0}for(k=g=0;k<c.length;k++)g+=c[k].totalCount;d=Array(g);for(k=n=0;k<b;k++)for(g=0;g<c.length;g++)k<f[g].length&&
(d[n++]=f[g][k]);for(k=0;k<e;k++)for(g=0;g<c.length;g++)k<i[g].length&&(d[n++]=i[g][k]);return d};s=4;for(var j={PATTERN_POSITION_TABLE:[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,
78,104,130],[6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]],G15:1335,G18:7973,G15_MASK:21522,getBCHTypeInfo:function(a){for(var c=a<<10;0<=j.getBCHDigit(c)-j.getBCHDigit(j.G15);)c^=j.G15<<j.getBCHDigit(c)-j.getBCHDigit(j.G15);return(a<<10|c)^j.G15_MASK},getBCHTypeNumber:function(a){for(var c=a<<12;0<=j.getBCHDigit(c)-
j.getBCHDigit(j.G18);)c^=j.G18<<j.getBCHDigit(c)-j.getBCHDigit(j.G18);return a<<12|c},getBCHDigit:function(a){for(var c=0;0!=a;)c++,a>>>=1;return c},getPatternPosition:function(a){return j.PATTERN_POSITION_TABLE[a-1]},getMask:function(a,c,d){switch(a){case 0:return 0==(c+d)%2;case 1:return 0==c%2;case 2:return 0==d%3;case 3:return 0==(c+d)%3;case 4:return 0==(Math.floor(c/2)+Math.floor(d/3))%2;case 5:return 0==c*d%2+c*d%3;case 6:return 0==(c*d%2+c*d%3)%2;case 7:return 0==(c*d%3+(c+d)%2)%2;default:throw Error("bad maskPattern:"+
a);}},getErrorCorrectPolynomial:function(a){for(var c=new q([1],0),d=0;d<a;d++)c=c.multiply(new q([1,l.gexp(d)],0));return c},getLengthInBits:function(a,c){if(1<=c&&10>c)switch(a){case 1:return 10;case 2:return 9;case s:return 8;case 8:return 8;default:throw Error("mode:"+a);}else if(27>c)switch(a){case 1:return 12;case 2:return 11;case s:return 16;case 8:return 10;default:throw Error("mode:"+a);}else if(41>c)switch(a){case 1:return 14;case 2:return 13;case s:return 16;case 8:return 12;default:throw Error("mode:"+
a);}else throw Error("type:"+c);},getLostPoint:function(a){for(var c=a.getModuleCount(),d=0,b=0;b<c;b++)for(var e=0;e<c;e++){for(var f=0,i=a.isDark(b,e),g=-1;1>=g;g++)if(!(0>b+g||c<=b+g))for(var h=-1;1>=h;h++)0>e+h||c<=e+h||0==g&&0==h||i==a.isDark(b+g,e+h)&&f++;5<f&&(d+=3+f-5)}for(b=0;b<c-1;b++)for(e=0;e<c-1;e++)if(f=0,a.isDark(b,e)&&f++,a.isDark(b+1,e)&&f++,a.isDark(b,e+1)&&f++,a.isDark(b+1,e+1)&&f++,0==f||4==f)d+=3;for(b=0;b<c;b++)for(e=0;e<c-6;e++)a.isDark(b,e)&&!a.isDark(b,e+1)&&a.isDark(b,e+
2)&&a.isDark(b,e+3)&&a.isDark(b,e+4)&&!a.isDark(b,e+5)&&a.isDark(b,e+6)&&(d+=40);for(e=0;e<c;e++)for(b=0;b<c-6;b++)a.isDark(b,e)&&!a.isDark(b+1,e)&&a.isDark(b+2,e)&&a.isDark(b+3,e)&&a.isDark(b+4,e)&&!a.isDark(b+5,e)&&a.isDark(b+6,e)&&(d+=40);for(e=f=0;e<c;e++)for(b=0;b<c;b++)a.isDark(b,e)&&f++;a=Math.abs(100*f/c/c-50)/5;return d+10*a}},l={glog:function(a){if(1>a)throw Error("glog("+a+")");return l.LOG_TABLE[a]},gexp:function(a){for(;0>a;)a+=255;for(;256<=a;)a-=255;return l.EXP_TABLE[a]},EXP_TABLE:Array(256),
LOG_TABLE:Array(256)},m=0;8>m;m++)l.EXP_TABLE[m]=1<<m;for(m=8;256>m;m++)l.EXP_TABLE[m]=l.EXP_TABLE[m-4]^l.EXP_TABLE[m-5]^l.EXP_TABLE[m-6]^l.EXP_TABLE[m-8];for(m=0;255>m;m++)l.LOG_TABLE[l.EXP_TABLE[m]]=m;q.prototype={get:function(a){return this.num[a]},getLength:function(){return this.num.length},multiply:function(a){for(var c=Array(this.getLength()+a.getLength()-1),d=0;d<this.getLength();d++)for(var b=0;b<a.getLength();b++)c[d+b]^=l.gexp(l.glog(this.get(d))+l.glog(a.get(b)));return new q(c,0)},mod:function(a){if(0>
this.getLength()-a.getLength())return this;for(var c=l.glog(this.get(0))-l.glog(a.get(0)),d=Array(this.getLength()),b=0;b<this.getLength();b++)d[b]=this.get(b);for(b=0;b<a.getLength();b++)d[b]^=l.gexp(l.glog(a.get(b))+c);return(new q(d,0)).mod(a)}};p.RS_BLOCK_TABLE=[[1,26,19],[1,26,16],[1,26,13],[1,26,9],[1,44,34],[1,44,28],[1,44,22],[1,44,16],[1,70,55],[1,70,44],[2,35,17],[2,35,13],[1,100,80],[2,50,32],[2,50,24],[4,25,9],[1,134,108],[2,67,43],[2,33,15,2,34,16],[2,33,11,2,34,12],[2,86,68],[4,43,27],
[4,43,19],[4,43,15],[2,98,78],[4,49,31],[2,32,14,4,33,15],[4,39,13,1,40,14],[2,121,97],[2,60,38,2,61,39],[4,40,18,2,41,19],[4,40,14,2,41,15],[2,146,116],[3,58,36,2,59,37],[4,36,16,4,37,17],[4,36,12,4,37,13],[2,86,68,2,87,69],[4,69,43,1,70,44],[6,43,19,2,44,20],[6,43,15,2,44,16],[4,101,81],[1,80,50,4,81,51],[4,50,22,4,51,23],[3,36,12,8,37,13],[2,116,92,2,117,93],[6,58,36,2,59,37],[4,46,20,6,47,21],[7,42,14,4,43,15],[4,133,107],[8,59,37,1,60,38],[8,44,20,4,45,21],[12,33,11,4,34,12],[3,145,115,1,146,
116],[4,64,40,5,65,41],[11,36,16,5,37,17],[11,36,12,5,37,13],[5,109,87,1,110,88],[5,65,41,5,66,42],[5,54,24,7,55,25],[11,36,12],[5,122,98,1,123,99],[7,73,45,3,74,46],[15,43,19,2,44,20],[3,45,15,13,46,16],[1,135,107,5,136,108],[10,74,46,1,75,47],[1,50,22,15,51,23],[2,42,14,17,43,15],[5,150,120,1,151,121],[9,69,43,4,70,44],[17,50,22,1,51,23],[2,42,14,19,43,15],[3,141,113,4,142,114],[3,70,44,11,71,45],[17,47,21,4,48,22],[9,39,13,16,40,14],[3,135,107,5,136,108],[3,67,41,13,68,42],[15,54,24,5,55,25],[15,
43,15,10,44,16],[4,144,116,4,145,117],[17,68,42],[17,50,22,6,51,23],[19,46,16,6,47,17],[2,139,111,7,140,112],[17,74,46],[7,54,24,16,55,25],[34,37,13],[4,151,121,5,152,122],[4,75,47,14,76,48],[11,54,24,14,55,25],[16,45,15,14,46,16],[6,147,117,4,148,118],[6,73,45,14,74,46],[11,54,24,16,55,25],[30,46,16,2,47,17],[8,132,106,4,133,107],[8,75,47,13,76,48],[7,54,24,22,55,25],[22,45,15,13,46,16],[10,142,114,2,143,115],[19,74,46,4,75,47],[28,50,22,6,51,23],[33,46,16,4,47,17],[8,152,122,4,153,123],[22,73,45,
3,74,46],[8,53,23,26,54,24],[12,45,15,28,46,16],[3,147,117,10,148,118],[3,73,45,23,74,46],[4,54,24,31,55,25],[11,45,15,31,46,16],[7,146,116,7,147,117],[21,73,45,7,74,46],[1,53,23,37,54,24],[19,45,15,26,46,16],[5,145,115,10,146,116],[19,75,47,10,76,48],[15,54,24,25,55,25],[23,45,15,25,46,16],[13,145,115,3,146,116],[2,74,46,29,75,47],[42,54,24,1,55,25],[23,45,15,28,46,16],[17,145,115],[10,74,46,23,75,47],[10,54,24,35,55,25],[19,45,15,35,46,16],[17,145,115,1,146,116],[14,74,46,21,75,47],[29,54,24,19,
55,25],[11,45,15,46,46,16],[13,145,115,6,146,116],[14,74,46,23,75,47],[44,54,24,7,55,25],[59,46,16,1,47,17],[12,151,121,7,152,122],[12,75,47,26,76,48],[39,54,24,14,55,25],[22,45,15,41,46,16],[6,151,121,14,152,122],[6,75,47,34,76,48],[46,54,24,10,55,25],[2,45,15,64,46,16],[17,152,122,4,153,123],[29,74,46,14,75,47],[49,54,24,10,55,25],[24,45,15,46,46,16],[4,152,122,18,153,123],[13,74,46,32,75,47],[48,54,24,14,55,25],[42,45,15,32,46,16],[20,147,117,4,148,118],[40,75,47,7,76,48],[43,54,24,22,55,25],[10,
45,15,67,46,16],[19,148,118,6,149,119],[18,75,47,31,76,48],[34,54,24,34,55,25],[20,45,15,61,46,16]];p.getRSBlocks=function(a,c){var d=p.getRsBlockTable(a,c);if(void 0==d)throw Error("bad rs block @ typeNumber:"+a+"/errorCorrectLevel:"+c);for(var b=d.length/3,e=[],f=0;f<b;f++)for(var h=d[3*f+0],g=d[3*f+1],j=d[3*f+2],l=0;l<h;l++)e.push(new p(g,j));return e};p.getRsBlockTable=function(a,c){switch(c){case 1:return p.RS_BLOCK_TABLE[4*(a-1)+0];case 0:return p.RS_BLOCK_TABLE[4*(a-1)+1];case 3:return p.RS_BLOCK_TABLE[4*
(a-1)+2];case 2:return p.RS_BLOCK_TABLE[4*(a-1)+3]}};t.prototype={get:function(a){return 1==(this.buffer[Math.floor(a/8)]>>>7-a%8&1)},put:function(a,c){for(var d=0;d<c;d++)this.putBit(1==(a>>>c-d-1&1))},getLengthInBits:function(){return this.length},putBit:function(a){var c=Math.floor(this.length/8);this.buffer.length<=c&&this.buffer.push(0);a&&(this.buffer[c]|=128>>>this.length%8);this.length++}};"string"===typeof h&&(h={text:h});h=r.extend({},{render:"canvas",width:256,height:256,typeNumber:-1,
correctLevel:2,background:"#ffffff",foreground:"#000000"},h);return this.each(function(){var a;if("canvas"==h.render){a=new o(h.typeNumber,h.correctLevel);a.addData(h.text);a.make();var c=document.createElement("canvas");c.width=h.width;c.height=h.height;for(var d=c.getContext("2d"),b=h.width/a.getModuleCount(),e=h.height/a.getModuleCount(),f=0;f<a.getModuleCount();f++)for(var i=0;i<a.getModuleCount();i++){d.fillStyle=a.isDark(f,i)?h.foreground:h.background;var g=Math.ceil((i+1)*b)-Math.floor(i*b),
j=Math.ceil((f+1)*b)-Math.floor(f*b);d.fillRect(Math.round(i*b),Math.round(f*e),g,j)}}else{a=new o(h.typeNumber,h.correctLevel);a.addData(h.text);a.make();c=r("<table></table>").css("width",h.width+"px").css("height",h.height+"px").css("border","0px").css("border-collapse","collapse").css("background-color",h.background);d=h.width/a.getModuleCount();b=h.height/a.getModuleCount();for(e=0;e<a.getModuleCount();e++){f=r("<tr></tr>").css("height",b+"px").appendTo(c);for(i=0;i<a.getModuleCount();i++)r("<td></td>").css("width",
d+"px").css("background-color",a.isDark(e,i)?h.foreground:h.background).appendTo(f)}}a=c;jQuery(a).appendTo(this)})}})(jQuery);
