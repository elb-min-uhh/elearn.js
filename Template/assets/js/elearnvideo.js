/*
* video.js v0.2 - 17/06/01
* Ergänzend zum elearn.js v0.9.9
* JavaScript Videoplayer - by Arne Westphal
* eLearning Buero MIN-Fakultaet - Universitaet Hamburg
*/

/**
* Initialisiert die Videoplayer
*/
$(document).ready(function() {
    initiateVideoPlayers();
});

// ----------------------------------------------------------------------------
// ------------------------- VIDEO PLAYER -------------------------------------
// ----------------------------------------------------------------------------

var video_hover_timers = {};
var video_volumes = {};
const video_timetypes = {
    TIMELEFT : 0,
    DURATION : 1
};
const FILETYPE_JSON = 'json';
const FILETYPE_CSV = 'csv';
var video_timestyle = 0;
var touchend_block = false;
var touchend_timer = null;

var user_notes = null;

function initiateVideoPlayers() {
    loadLocalVideoNotesStorage();

    $('video').each(function(i,e) {
        this.controls = false;

        $(this).wrap('<div class="video-container">');
        $(this).wrap("<div class='elearnjs-video hovered' tabindex='-1'>");

        var div = $(this).parent();

        div.append("<div class='mobile-overlay'><div class='icon playpause paused'></div></div>");
        div.append("<div class='loading-overlay'><div class='loading-con'>"
                      + "<div class='loading-animation'>"
                        + "<div class='background'></div>"
                        + "<div class='inner'><div class='light'></div></div>"
                        + "<div class='inner skip'><div class='light'></div></div>"
                      + "</div>"
                    + "</div></div>");
        if(this.autoplay) {
            this.play();
        }
        else {
            div.append("<div class='play-overlay'><div class='icon play'></div></div>");
        }
        div.append("<div class='controls'>"
                      + "<div class='bottom-row'>"
                        + "<div class='icon playpause playing' title='Play'></div>"
                        + "<div class='volume'>"
                            + "<div class='icon high' title='Mute'></div>"
                            + "<div class='volume-con'>"
                                + "<div class='volume-wrap'>"
                                    + "<div class='volume-bar'></div>"
                                    + "<div class='volume-control'></div>"
                                + "</div>"
                            + "</div>"
                        + "</div>"
                        + "<div class='text playtime' title='Time'></div>"
                        + "<div class='video-progress-con'>"
                            + "<div class='video-progress'><div class='video-progress-loaded'></div><div class='video-progress-bar'></div></div>"
                            + "<div class='video-progress-pointer'></div>"
                        + "</div>"
                        + "<div class='text timeleft' title='Time left'></div>"
                        + "<div class='icon fullscreen' title='Fullscreen'></div>"
                      + "</div>"
                    + "</div>");

        addVideoPlayerListener(div);
        videoCheckForBrowserSpecifics(div);
        updateVideoVolume(div);
    });

    addGenerelVideoPlayerListener();
    
    // User to explicitly set video-note width to equal video width
    eLearnJS.registerAfterWindowResize("video-resize", resizeAllVideoPlayers);
    eLearnJS.registerAfterShow("video-resize", resizeAllVideoPlayers);
    eLearnJS.addTouchMouseChangeListener("video-mobile", switchTouchMouse);
    initiateVideoNotes();
}

function addGenerelVideoPlayerListener() {
    // Fullscreenchange
    $(document).bind('webkitfullscreenchange mozfullscreenchange fullscreenchange', function() {
        checkVideoFullscreen();
    });

    // Video Progress Mouseup
    $(document).on('mouseup touchend', function(event) {
        if((event.type === "touchend" || event.button == 0) && videoProgressMouseDown) {
            if(videoProgressMouseDownTarget != null) {
                event.preventDefault();
                event.stopPropagation();
                if(!videoOverProgress) videoProgressMouseDownTarget.find('.progress-hover-time').remove();
                setVideoMouseDown(videoProgressMouseDownTarget, false);
            }
            return false;
        }
        else {
            return true;
        }
    });

    // Video Volume Mouseup
    $(document).on('mouseup touchend', function(event) {
        if(videoVolumeMouseDownTarget != null) {
            event.preventDefault();
            event.stopPropagation();
            setVideoVolumeMouseDown(videoVolumeMouseDownTarget, false, event);
        }
    });
}

function addVideoPlayerListener(div) {

    videoAddButtonListeners(div);
    videoAddUserInteractionListeners(div);
    videoAddProgressBarListeners(div);
    videoAddVolumeListeners(div);
    videoAddEventListeners(div);

    // fullscreen listeners
    div.on('webkitfullscreenchange mozfullscreenchange fullscreenchange', function(event) {
        checkVideoFullscreen();
    });
    div.find('video').on('webkitfullscreenchange mozfullscreenchange fullscreenchange', function(event) {
        checkVideoFullscreen();
    });
}


function videoAddButtonListeners(div) {
    // buttons
    div.find('.playpause').click(function(event) {
        event.preventDefault();
        event.stopPropagation();
        videoTogglePlay(div);
        videoHover(div);
    });
    div.find('.volume').find('.icon').on('mouseup touchend', function(event) {
        videoVolumeClick(div, event);
    });
    div.find('.volume').on('mouseenter', function(event) {
        videoVolumeHover(div, event);
    });
    div.find('.volume').on('mouseleave', function(event) {
        videoVolumeHover(div, event);
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
}

function videoAddUserInteractionListeners(div) {
    div.on('touchstart touchend touchcancel', function(event) {
        videoRefreshHover(div, event);
    });

    // overlay
    div.find('.play-overlay').on('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        videoTogglePlay(div);
        videoHover(div);
        div.find('.play-overlay').remove();
    });

    // general player
    div.on('mousemove', function(event) {
        if(!div.is('.mobile')) {
            videoHover(div);
        }
    });
    div.on('mouseup touchend', function(event) {
        if(event.type === "touchend" || event.button == 0) {
            // other listeneres take care of these
            if(videoProgressMouseDown || videoVolumeMouseDown
                || $(event.target).is('.bottom-row') || $(event.target).is('.bottom-row *')
                || $(event.target).is('.play-overlay') || $(event.target).is('.play-overlay *')
                || $(event.target).is('.mobile-overlay .playpause')
                || $(event.target).is('.error-con') || $(event.target).is('.error-con *')) {
                return true;
            }

            // touch
            if(event.type === "touchend") {
                // keine clicks durch 2. mouse event auf eingeblendete Elemente
                setTimeout(function() {videoToggleHover(div)}, 50);
                touchend_block = true;
                clearTimeout(touchend_timer);
                touchend_timer = setTimeout(function() {touchend_block = false;}, 100);
            }
            // no touch
            else if(!touchend_block) {
                videoOnClick(div);
            }
        }
    });
    div.on('mouseleave', function(event) {
        if(!div.is('.mobile')) {
            videoHoverEnd(div);
        }
    });

    div.bind('keypress', function(event) {
        videoKeyPress(div, event);
    });
}

function videoAddProgressBarListeners(div) {
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
    div.on('mousemove touchmove', function(event) {
        videoProgressMouseMove(div, event);
    });
    div.find('.video-progress-con').on('mousedown touchstart', function(event) {
        event.preventDefault();
        event.stopPropagation();
        setVideoMouseDown(div, true);
        videoProgressMouseMove(div, event);
        if(event.type === "touchstart") div.append('<div class="progress-hover-time"></div>');
    });
}

function videoAddVolumeListeners(div) {
    // listener for video volume control
    div.on('mousemove touchmove', function(event) {
        if(videoVolumeMouseDown && videoVolumeMouseDownTarget != null) {
            event.preventDefault();
            event.stopPropagation();
            videoProgressVolumeMouseMove(div, event);
        }
    });
    div.find('.volume-con').on('mousedown touchstart', function(event) {
        setVideoVolumeMouseDown(div, true, event);
    });
}

function videoAddEventListeners(div) {
    // listener to video progress
    div.find('video').on('ended', function(event) {
        videoHover(div);
    });
    div.find('video').on('timeupdate progress', function(event) {
        updateVideoTime(div);
        updateVideoUserNoteTime(div);
    });
    div.find('video').on('play', function(event) {
        videoUpdatePlayPauseButton(div);
    });
    div.find('video').on('pause', function(event) {
        videoUpdatePlayPauseButton(div);
    });
    div.find('video').on('volumechange', function(event) {
        updateVideoVolume(div);
    });
    div.find('video').on('error abort', function(event) {
        videoOnError(div, event);
    });
    div.find('video').on('canplay', function(event) {
        videoRemoveError(div, event);
        videoRemoveBuffering(div);
    });
    div.find('video').on('waiting', function(event) {
        videoOnBuffering(div, event);
    });
    div.find('video').on('resize', function(event) {
        resizeVideoPlayer(div);
    });
    videoCheckDelayedError(div);
}




function videoCheckForBrowserSpecifics(div) {
    var device = "";
    var ua = navigator.userAgent.toLowerCase();
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
        device = "ios";
    }

    if(device === "ios") {
        // hide volume, because it doesn't work on iOs
        div.find('.volume').hide()
    }
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
    if(trgt.is('.mobile-overlay *') || trgt.is('.controls *')) {
        videoHover(div);
    }
}

function videoHover(div) {
    if(!div.is(".hovered")) {
        div.addClass("hovered");
    }
    var vid = div.find('video')[0];
    var idx = $('.elearnjs-video').index(div);
    if(video_hover_timers[idx] != undefined) clearTimeout(video_hover_timers[idx]);
    if(!(vid.paused && div.is('.mobile'))) {
        video_hover_timers[idx] = setTimeout(function(){
            if(videoProgressMouseDown || videoVolumeMouseDown) {
                videoHover(div);
            }
            else {
                videoHoverEnd(div);
            }
        }, 2500);
    }
}

function videoHoverEnd(div) {
    var vid = div.find('video')[0];
    if(!vid.ended) {
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
        if(secSwipeBefore !== undefined && keyEnabledBefore !== undefined) {
            eLearnJS.generalSectionSwipeEnabled(secSwipeBefore);
            eLearnJS.setKeyNavigationEnabled(keyEnabledBefore);
            secSwipeBefore = undefined;
            keyEnabledBefore = undefined;
        }
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

    if(vid.playbackRate === 0) {
        vid.playbackRate = 1;
    }

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
    }
    // pause
    else {
        div.find('.playpause').attr("title", 'Pause');
        div.find('.playpause').addClass("playing");
        div.find('.playpause').removeClass("paused");
    }
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


var secSwipeBefore = undefined;
var keyEnabledBefore = undefined;

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
        if(secSwipeBefore === undefined && keyEnabledBefore === undefined) {
            secSwipeBefore = eLearnJS.isSectionSwipeEnabled();
            keyEnabledBefore = eLearnJS.isKeyNavigationEnabled();
            eLearnJS.generalSectionSwipeEnabled(false);
            eLearnJS.setKeyNavigationEnabled(false);
        }
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
        if(secSwipeBefore !== undefined && keyEnabledBefore !== undefined) {
            eLearnJS.generalSectionSwipeEnabled(secSwipeBefore);
            eLearnJS.setKeyNavigationEnabled(keyEnabledBefore);
            secSwipeBefore = undefined;
            keyEnabledBefore = undefined;
        }
    }
}

// VOLUME --------------------------------------------------

var withinVolumeControl = false;
var videoVolumePending = {};
var videoVolumeMouseDown = false;
var videoVolumeMouseDownTarget = null;

/**
* Called when clicked on the volume icon
* should open volume control on touch devices and mute/unmute otherwise
*/
function videoVolumeClick(div, e) {
    var vid = div.find('video')[0];
    var idx = $('.elearnjs-video').index(div);

    if(e.type === "touchend") {
        touchend_block = true;
        clearTimeout(touchend_timer);
        touchend_timer = setTimeout(function() {touchend_block = false;}, 100);
    }

    if(e.type === "touchend" || !touchend_block) {
        if(div.is('.mobile')) {
            videoSetVolumeControlOpen(div, !div.find('.volume').is('.controlopen'));
        }
        else if($(e.target).is('.icon') && !videoVolumeMouseDown) {
            if(vid.volume > 0) {
                video_volumes[idx] = vid.volume;
                vid.volume = 0;
            }
            else if(video_volumes[idx] != undefined && video_volumes[idx] > 0){
                vid.volume = video_volumes[idx];
            }
            // should never happen
            else {
                vid.volume = 0.5;
            }
        }
    }
}

/**
* Called when hovering over the volume icon
* shouldn't do anything on touch devices, because they have no hover
*/
function videoVolumeHover(div, event) {
    if(!div.is('.mobile')) {
        if(event.type === "mouseenter") {
            withinVolumeControl = true;
            videoSetVolumeControlOpen(div, true);
        }
        else if(event.type === "mouseleave") {
            withinVolumeControl = false;
            if(!videoVolumeMouseDown) {
                videoSetVolumeControlOpen(div, false);
            }
        }
    }
}

/**
* Opens or closes the Volume Control
* is called by videoVolumeHover, videoVolumeClick and setVideoVolumeMouseDown
*/
function videoSetVolumeControlOpen(div, bool) {
    var idx = $('.elearnjs-video').index(div);
    if(bool) {
        var controls = div.find('.controls');
        var volume = controls.find('.volume');
        if(!volume.is('.controlopen')) {
            clearTimeout(videoVolumePending[idx]);
            volume.addClass('hovered');
            volume[0].offsetHeight; // to force css change
            volume.addClass('controlopen');
        }
    }
    else {
        var controls = div.find('.controls');
        var volume = controls.find('.volume');
        if(volume.is('.controlopen')) {
            volume.removeClass('controlopen');
            videoVolumePending[idx] = setTimeout(function() {
                volume.removeClass('hovered');
            }, 115); /* based on transition time, calculated by sizes */
        }
    }
}

/**
* Called when moving the mouse over any .elearnjs-video (@param: div)
* Used to apply volume changes
*/
function videoProgressVolumeMouseMove(div, e) {
    if(videoVolumeMouseDown) {
        e.preventDefault();
        e.stopPropagation();

        videoHover(div);

        var vid = div.find('video')[0];
        var volume = div.find('.volume');
        var pos = 0;
        if(e.type.toLowerCase() === "mousemove"
            || e.type.toLowerCase() === "mousedown") {
            pos = e.originalEvent.pageY - volume.find('.volume-wrap').offset().top;
        }
        else if(e.type.toLowerCase() === "touchmove"
                || e.type.toLowerCase() === "touchstart"){
            pos = e.originalEvent.touches[0].pageY - volume.find('.volume-wrap').offset().top;
        }

        var perc = pos/volume.find('.volume-wrap').height();
        if(perc < 0) perc = 0;
        if(perc > 1) perc = 1;

        vid.volume = 1-perc;
    }
}

/**
* Used to set volume change active or not.
*/
function setVideoVolumeMouseDown(div, bool, e) {
    videoVolumeMouseDown = bool;
    if(bool) {
        videoVolumeMouseDownTarget = div;
        // instant position calculation
        videoProgressVolumeMouseMove(div, e);
    }
    else {
        if(!withinVolumeControl && !div.is('.mobile')) {
            videoSetVolumeControlOpen(div, false);
        }
        // add volume to last volume
        var vid = div.find('video')[0];
        if(vid.volume > 0) {
            var idx = $('.elearnjs-video').index(div);
            video_volumes[idx] = vid.volume;
        }
        videoVolumeMouseDownTarget = null;
    }
}


/**
* Called when the video within the div has a volume change
*/
function updateVideoVolume(div) {
    var vid = div.find('video')[0];
    var btn = div.find('.volume').find('.icon');
    var volume = div.find('.volume');
    volume.find('.volume-control').css('top', (1-vid.volume)*100 + "%");

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

// VIDEO KEYBOARD EVENTS ------------------------------------

function videoKeyPress(div, event) {
    if(event.which === 32) {
        event.preventDefault();
        videoTogglePlay(div);
        videoHover(div);
    }
}

// PROGRESSBAR ----------------------------------------------

var videoOverProgress = false;
var videoProgressMouseDownTarget = null;
var videoProgressMouseDown = false;
var videoSpeedBefore = 1;

function setVideoMouseDown(div, b) {
    var vid = div.find('video')[0];
    if(b && !videoProgressMouseDown) {
        videoProgressMouseDownTarget = div;
        videoSpeedBefore = vid.playbackRate;
        vid.playbackRate = 0;
        div.find('.video-progress-bar').addClass('notransition');
        div.find('.video-progress-pointer').addClass('notransition');
        videoProgressMouseDown = b;
    }
    else if(!b && videoProgressMouseDown) {
        if(videoSpeedBefore != vid.playbackRate) {
            videoProgressMouseDownTarget = null;
            vid.playbackRate = videoSpeedBefore;
        }
        div.find('.video-progress-bar')[0].offsetHeight;
        div.find('.video-progress-pointer')[0].offsetHeight;
        div.find('.video-progress-bar').removeClass('notransition');
        div.find('.video-progress-pointer').removeClass('notransition');
        videoProgressMouseDown = b;
        updateVideoTime(div);
    }
}

function videoProgressMouseEnter(div, e) {
    var con = div.find('.video-progress-con');
    var back = con.find('.video-progress');
    back.append('<div class="video-progress-hover">');
    div.append('<div class="progress-hover-time"></div>');
    videoOverProgress = true;
}

function videoProgressMouseLeave(div, e) {
    var con = div.find('.video-progress-con');
    con.find('.video-progress-hover').remove();
    if(!videoProgressMouseDown) div.find('.progress-hover-time').remove();
    videoOverProgress = false;
}

function videoProgressMouseMove(div, e) {

    if(videoOverProgress || videoProgressMouseDown) {
        var vid = div.find('video')[0];
        var pos = 0;

        if(videoProgressMouseDown) {
            e.preventDefault();
            e.stopPropagation();
            videoHover(div); // additional since other event is prevented
        }

        if(e.type.toLowerCase() === "mousemove"
            || e.type.toLowerCase() === "mousedown") {
            pos = e.originalEvent.pageX - div.find('.video-progress').offset().left;
        }
        else if(e.type.toLowerCase() === "touchmove"
                || e.type.toLowerCase() === "touchstart"){
            pos = e.originalEvent.touches[0].pageX - div.find('.video-progress').offset().left;
        }

        if(pos < 0) pos = 0;
        if(pos > div.find('.video-progress').width()) pos = div.find('.video-progress').width();

        var pos_perc = pos / div.find('.video-progress').width();
        div.find('.video-progress-hover').css("width", pos_perc*100 + "%");

        if(videoProgressMouseDown) {
            // change position without transition effect
            div.find('.video-progress-bar').css("width", pos_perc*100 + "%");
            div.find('.video-progress-pointer').css("left", pos_perc*100 + "%");
            vid.currentTime = vid.duration * pos_perc;
        }
    }
    div.find('.progress-hover-time').html(createTimeStringColons(pos_perc * vid.duration));
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
    if(!videoProgressMouseDown) {
        time_field.html(createTimeStringColons(time));
        if(video_timestyle === video_timetypes.TIMELEFT) {
            if(!isNaN(timeleft)) timeleft_field.html("-" + createTimeStringColons(timeleft));
        }
        else if(video_timestyle === video_timetypes.DURATION) timeleft_field.html(createTimeStringColons(vid.duration));
    }

    // progress bar
    var progress_bar = div.find('.video-progress-bar');
    progress_bar.css("width", (vid.currentTime*100)/vid.duration + "%");
    div.find('.video-progress-pointer').css("left",
                                    (vid.currentTime*100)/vid.duration + "%");

    // buffered bar
    var latest_end = 0;
    for(var i=0; i<vid.buffered.length; i++) {
        if(vid.buffered.end(i) > latest_end) {
            latest_end = vid.buffered.end(i);
        }
    }
    var buffered_perc = latest_end / vid.duration;
    div.find('.video-progress-loaded').css("width", buffered_perc*100 + "%");
}

function videoOnError(div, event) {
    div.append('<div class="error-con">');
    div.find('.error-con').append('<span>Ein Fehler ist aufgetreten.<br>Das Video kann nicht abgespielt werden.<br>Klicken zum neu laden!</span>');
    div.find('.error-con').on('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        div.find('video')[0].load();
        videoRemoveError(div);
        videoCheckDelayedError(div);
    });
}

function videoRemoveError(div, event) {
    div.find('.error-con').remove();
}

function videoCheckDelayedError(div) {
    setTimeout(function() {
        var vid = div.find('video')[0];
        if(vid.networkState === 3) {
            videoOnError(div);
        }
        else {
            videoRemoveError(div);
        }
    }, 1000);
}


function videoOnBuffering(div, event) {
    if(div.find('.play-overlay').length == 0) {
        if(div.is('.mobile')) div.find('.mobile-overlay').hide();
        div.find('.loading-overlay').show();
    }
}

function videoRemoveBuffering(div, event) {
    if(div.find('.play-overlay').length == 0) {
        if(div.is('.mobile')) div.find('.mobile-overlay').show();
        div.find('.loading-overlay').hide();
    }
}

function resizeAllVideoPlayers() {
    $('.elearnjs-video:visible').each(function(i,e) {
        resizeVideoPlayer($(this));
    });
}


function resizeVideoPlayer(div) {
    var videoContainer = div.closest('.video-container');
    videoContainer.find('.video_notes_wrapper').css("width", div.find('video').width());
}

function switchTouchMouse() {
    if(eLearnJS.isTouchSupported()) {
        $('.elearnjs-video').addClass("mobile");
    }
    else {
        $('.elearnjs-video').removeClass("mobile");
    }
}

// ------------------------- VIDEO NOTES ------------------------------------

var videoNoteTimes = [];

/**
* Initialisiert die Time Notes
*/
function initiateVideoNotes() {
    $('.video_note').addClass('backup');

    loadLocalVideoNotesStorage();

    // create list with sorted times for faster checking if something needs to be shown
    $('.elearnjs-video').each(function(idx,e) {
        var videoContainer = $(this).closest('.video-container');
        var videoNotesContainer = $("<div class='video_notes_container'>");
        var videoNotes;
        var userNotes;

        videoContainer.append(videoNotesContainer);

        // No video notes in .html
        if(videoContainer.next('.video_notes').length !== 0) {
            videoNotes = videoContainer.next('.video_notes');
            videoNotesContainer.append(videoNotes);
            videoNotes.addClass("note_container");
            addShowAllTo(videoNotes);
        }

        // Create user note container
        if(videoContainer.find('.allow_user_notes').length > 0) {
            userNotes = getUserVideoNotesContainer();
            videoContainer.addClass('allow_user_notes');
            videoNotesContainer.append(userNotes);
            userNotes.addClass("note_container");
            addShowAllTo(userNotes);
            addUserNoteMenuTo(userNotes);
            addVideoUserNoteListeners(videoContainer);
        }

        // Wrap in tabbed box if both are present
        if(videoNotes != undefined && userNotes != undefined) {
            videoNotesContainer.addClass("tabbed-box");

            videoNotes.addClass("tab");
            videoNotes.attr("name", "Annotationen");

            userNotes.addClass("tab");
            userNotes.attr("name", "Notizen");

            initiateTabbedBox(videoNotesContainer);

            videoNotesContainer.closest(".tabbed-container").addClass("video_notes_wrapper");
        }
        else {
            videoNotesContainer.addClass("video_notes_wrapper");
        }

        var video_user_notes = getVideoNotesFor(videoContainer.find('video').find('source').first()[0].src);
        // from back to front, since addNoteToUserNotes adds in front
        if(video_user_notes != undefined) {
            for(var i=video_user_notes.length-1; i>=0; i--) {
                var user_note = video_user_notes[i];
                addNoteToUserNotes(videoContainer,
                    createUserNote(user_note.text, user_note.timefrom, user_note.timeto));
            }
        }

        // fetch existing video notes
        updateUserNotes(videoContainer);

        $(this).find('video').on('timeupdate', function(event) {
            noteTimeUpdate($(e), videoNotesContainer, idx);
        });
    });

    initiateUserNotes();
}

function getUserVideoNotesContainer() {
    var userNotes = $('<div class="user_notes timestamps"><h4>Notizen</h4></div>');
    userNotes.append('<div class="note_add_container">'
                        + '<hr>'
                        + '<form accept-charset="UTF-8">'
                        + '<input class="user_note_from" placeholder="Startzeit (<HH>:<MM>:SS)" type="text"/>'
                        + '<input class="user_note_to" placeholder="Endzeit (<HH>:<MM>:SS)" type="text"/>'
                        + '<textarea class="user_note_text" placeholder="Schreibe eine Notiz... (diese sind lokal gespeichert und nicht öffentlich)"></textarea>'
                        + '</form>'
                        + '<button class="note_add">Notiz speichern</button>'
                        + '<button class="note_cancel">Abbrechen</button>'
                        + '</div>');
    userNotes.append('<button class="toggle_note_add">Notiz hinzufügen</button>');

    return userNotes;
}

function addShowAllTo(notes) {
    notes.prepend('<label class="show_all_notes"><input type="checkbox" name="show_all" value="show_all"/>Alle einblenden</label>');
    notes.find('input[name="show_all"]').on('change', function(e) {
        showAllNotes(notes, $(this).is(':checked'));
    });
}

function addUserNoteMenuTo(notes) {
    notes.prepend('<div class="user_note_menu_wrap general_user_note_menu" onclick="javascript: toggleUserNoteMenu(this);"><div class="user_note_menu">m</div></div>');
}

function showAllNotes(notes, b) {
    var videoContainer = notes.closest('.video-container');
    var idx = $('.elearnjs-video').index(videoContainer.find('.elearnjs-video'));

    // show all
    if(b) {
        notes.addClass("show_all");
        for(var i=0; i<videoNoteTimes[idx].length; i++) {
            var info = videoNoteTimes[idx][i];
            var display_note = notes.find('.video_note').not('.backup').filter('#'+info["index"]);
            if(display_note.length == 0) {
                showVideoNote(notes, info);
            }
        }
    }
    else if(!b) {
        notes.removeClass("show_all");
        removeAllVideoNotes(notes);
        noteTimeUpdate(videoContainer, notes, idx);
    }
}

function checkShowAll(notes_con) {
    notes_con.find('.note_container').each(function(i,e) {
        if($(this).is('.show_all')) {
            showAllNotes($(this), true);
        }
    });
}

function addNotesToProgressbar(videoContainer, index) {
    var vid = videoContainer.find('video')[0];
    var length = vid.duration;

    if(vid.readyState == 0 || vid.duration == 0) {
        setTimeout(function() {addNotesToProgressbar(videoContainer, index);}, 100);
    }
    else {
        videoContainer.find('.video-progress-con').find('.video-progress-note').remove();
        for(var i=0; i<videoNoteTimes[index].length; i++) {
            var info = videoNoteTimes[index][i];
            var start = info['time'];

            var progress_note = $('<div class="video-progress-note">');
            var progress_pos = (start*100)/length;
            if(info['user_note']) progress_note.addClass('user-progress-note');
            progress_note.css('left', progress_pos + "%");
            // add all notes, always, since collisions are always based on the width at this moment
            videoContainer.find('.video-progress').after(progress_note);
        }
    }
}

/**
* Wird beim timeupdate event eines videos ausgeführt. Blendet notes ein oder aus
*/
function noteTimeUpdate(videoContainer, notes_con, index) {
    var vid = videoContainer.find('video')[0];
    var time = vid.currentTime;

    for(var i=0; i<videoNoteTimes[index].length; i++) {
        var info = videoNoteTimes[index][i];
        var backup_note = notes_con.find('.video_note.backup').filter('#'+info["index"]);
        var display_note = notes_con.find('.video_note').not('.backup').filter('#'+info["index"]);

        if(!backup_note.closest('.note_container').is('.show_all')) {
            // time not reached
            if(info["time"] > time) {
                // remove
                display_note.remove();
            }
            else if(info["time"] <= time) {
                // note ended
                if(info["time_to"] != undefined
                    && info["time_to"] != -1
                    && info["time_to"] <= time) {
                    // remove
                    display_note.remove();
                }
                else {
                    // skip if already shown
                    if(display_note.length > 0) continue;
                    // create new node
                    showVideoNote(notes_con, info);
                }
            }
        }
    }
    checkVisibleNotes(videoContainer, notes_con);
}

function showVideoNote(notes_con, info) {
    var original_note = notes_con.find('.video_note.backup').filter('#'+info["index"]);
    var new_note = original_note.clone();
    new_note.removeClass('backup');
    //new_note.attr('id', info["index"]);

    // timestamp if activated
    if(original_note.closest('.note_container').is('.timestamps')) {
        new_note.prepend('<span class="video_note_timestamp">'
                            +createTimeStringColons(info["time"])+'</span>');
    }
    // add user note menu button
    if(original_note.is('.user_note')) {
        new_note.prepend('<div class="user_note_menu_wrap" onclick="javascript: toggleUserNoteMenu(this);"><div class="user_note_menu">m</div></div>');
    }

    new_note.wrapInner('<div class="content">');
    original_note.after(new_note);
}

function removeAllVideoNotes(notes_con) {
    notes_con.find('.video_note').not('.backup').remove();
}

function checkVisibleNotes(videoContainer, notes_con) {
    if(notes_con.find('.video_note').not('.backup').length > 0) {
        videoContainer.parent().addClass('noted_video');
    }
    else {
        videoContainer.parent().removeClass('noted_video');
    }
}

/**
* Erstellt ein sortiertes Array mit Objekten die einen Index haben, der auf ein
* .video_note objekt hinweist, eine anfangszeit time und ggf. eine time_to.
* Sortiert ist das Array nach dem key "time"
*/
var lastIndexSet = -1;

function getVideoNoteTimeArray(videoContainer) {
    var times = [];
    videoContainer.find('.video_note.backup').each(function(i,e) {
        var timeFrom = $(this).attr('timefrom');
        var timeTo = $(this).attr('timeto');
        var user_note = $(this).is(".user_note");

        // get and set id on backup note
        var id = $(this).attr("id");
        if(id == undefined || id.length == 0 || id == "undefined") {
            lastIndexSet++
            id = lastIndexSet;
            $(this).attr("id", id);
        }

        if(timeTo == undefined) timeTo = -1;
        times.push({"time" : parseTimeString(timeFrom),
                    "time_to" : parseTimeString(timeTo),
                    "user_note" : user_note,
                    "index" : id});
    });
    times.sort(function(a,b) {
        return a["time"]-b["time"];
    });
    return times;
}


// --------------- User Notes ----------------

// container div in which a note is edited (jquery object)
var editingDiv = null;
// the note being edited (jquery object)
var editingNote = null;

var userNoteMenuNode = null;

function initiateUserNotes() {
    addUserNoteListeners();
}

function updateUserNotes(videoContainer) {
    // fetch existing video notes
    var notes_con = videoContainer.find('.video_notes_container');
    var idx = $('.elearnjs-video').index(videoContainer.find('.elearnjs-video'));
    videoNoteTimes[idx] = getVideoNoteTimeArray(notes_con);
    removeAllVideoNotes(notes_con);
    noteTimeUpdate(videoContainer, notes_con, idx);
    checkShowAll(notes_con);
    addNotesToProgressbar(videoContainer, idx);
}

function addUserNoteListeners() {
    $(document).on('click', function(e) {
        if($('.user_note_dropdown').length > 0
            &&!$(e.target).is('.user_note_menu_wrap')
            && !$(e.target).is('.user_note_menu_wrap *')) {
            hideUserNoteMenu();
        }
    });
}

function addVideoUserNoteListeners(videoContainer) {
    videoContainer.find('.toggle_note_add').on('click', function() {
        setVideoNotesAddContainerVisible(videoContainer, true);
    });

    videoContainer.find('.note_add').on('click', function() {
        saveVideoNote(videoContainer);
    });

    videoContainer.find('.note_cancel').on('click', function() {
        setVideoNotesAddContainerVisible(videoContainer, false);
    });
}

function setVideoNotesAddContainerVisible(videoContainer, bool) {
    if(bool) {
        videoContainer.find('.note_add_container').show();
        videoContainer.find('.toggle_note_add').hide();
    }
    else {
        videoContainer.find('.note_add_container').hide();
        videoContainer.find('.toggle_note_add').show();
        cancelEdits(videoContainer);
    }
}

function createUserNote(text, timefrom, timeto, id) {
    return $('<div class="video_note backup user_note" timefrom="'
                    + createTimeStringLetters(parseTimeString(timefrom))
                    + '" timeto="'
                    + createTimeStringLetters(parseTimeString(timeto))
                    + '" id="' + id + '">'
                    + text
                    + '</div>');
}

function addNoteToUserNotes(videoContainer, note) {
    var existingNotes = videoContainer.find('.user_notes').find('.video_note');
    if(existingNotes.length > 0) {
        // always at first possible position
        videoContainer.find('.user_notes').find('.video_note').first().before(note);
    }
    else {
        videoContainer.find('.note_add_container').before(note);
    }
}

function saveVideoNote(videoContainer) {
    var noteAddContainer = videoContainer.find('.note_add_container');
    var fr = noteAddContainer.find('.user_note_from').val();
    var to = noteAddContainer.find('.user_note_to').val();
    var text = noteAddContainer.find('.user_note_text').val();

    if(fr.length == 0) {
        fr = noteAddContainer.find('.user_note_from').attr("placeholder").replace(/^\D*/g, "");
    }
    if(to.length == 0) {
        to = noteAddContainer.find('.user_note_to').attr("placeholder").replace(/^\D*/g, "");
    }

    if(text.length == 0) {
        alert("Text eingeben, um Notiz speichern zu können.");
        return;
    }
    else if(parseTimeString(fr) == undefined) {
        alert("Die Startzeit ist keine gültige Eingabe.\r\nFormat: HH:MM:SS");
        return;
    }
    else if(parseTimeString(to) == undefined) {
        alert("Die Endzeit ist keine gültige Eingabe.\r\nFormat: HH:MM:SS");
        return;
    }

    text = text.trim().replace(/\r/g, "").replace(/\n/g, "<br>");

    var element = createUserNote(text, fr, to);

    if(!videoContainer.is(editingDiv) || editingNote == null) {
        addNoteToUserNotes(videoContainer, element);
    }
    else {
        editingNote.replaceWith(element);
    }
    cancelEdits(videoContainer);

    updateUserNotes(videoContainer);
    updateUserNotesArray(videoContainer);

    setVideoNotesAddContainerVisible(videoContainer, false);
}

function editNote(videoContainer, note) {
    editingDiv = videoContainer;
    editingNote = note;

    var text = editingNote.html().trim().replace(/<br>/g, "\r\n");

    videoContainer.find('.note_add_container').find('.user_note_from').val(createTimeStringColons(parseTimeString(editingNote.attr("timefrom"))));
    videoContainer.find('.note_add_container').find('.user_note_to').val(createTimeStringColons(parseTimeString(editingNote.attr("timeto"))));
    videoContainer.find('.note_add_container').find('textarea').val(text);

    setVideoNotesAddContainerVisible(videoContainer, true);
}

function cancelEdits(videoContainer) {
    videoContainer.find('.note_add_container').find('.user_note_from').val("");
    videoContainer.find('.note_add_container').find('.user_note_to').val("");
    videoContainer.find('.note_add_container').find('textarea').val("");
    editingDiv = null;
    editingNote = null;
}

function deleteNote(videoContainer, note) {
    videoContainer.find('.user_note').filter('#' + note.attr('id')).remove();

    updateUserNotes(videoContainer);
    updateUserNotesArray(videoContainer);
}

function moveNote(videoContainer, display_note, backup_note, direction) {
    var user_notes = backup_note.closest('.user_notes');

    var idx = user_notes.find('.user_note').not('.backup').index(display_note);
    var newPos = idx + direction;


    // determine position of display_note
    // move up
    if(direction < 0) {
        if(newPos < 0) newPos = 0;
    }
    // move down
    else if(direction > 0) {
        if(newPos > user_notes.find('.user_note').not('.backup').length - 1)
            newPos = user_notes.find('.user_note').not('.backup').length - 1;
    }

    // determine neighbor to align to
    var neighbor = user_notes.find('.user_note').not('.backup').eq(newPos);
    var neighborBackup = user_notes.find('.user_note.backup').filter('#' + neighbor.attr('id'));

    // move display note
    if(direction < 0) {
        neighborBackup.before(display_note);
    }
    // move down
    else if(direction > 0) {
        neighborBackup.after(display_note);
    }

    // move backup_not before display_note
    display_note.before(backup_note);

    updateUserNotes(videoContainer);
    updateUserNotesArray(videoContainer);
}

function updateUserNotesArray(videoContainer) {
    var src = videoContainer.find('video').find('source').first()[0].src;
    var user_video_notes = [];
    videoContainer.find('.user_notes').find('.user_note.backup').each(function(i, e) {
        var video_note_object = {timefrom: $(this).attr('timefrom'),
                                timeto: $(this).attr('timeto'),
                                text: $(this).html()};
        user_video_notes.push(video_note_object);
    });
    setVideoNotesFor(src, user_video_notes);
}

function updateVideoUserNoteTime(div) {
    var videoContainer = div.closest('.video-container');
    var noteAddContainer = videoContainer.find('.note_add_container');
    var userNoteFrom = noteAddContainer.find('.user_note_from');
    var userNoteTo = noteAddContainer.find('.user_note_to');

    // default user note duration
    var noteDuration = 10;

    var timeFrom = parseTimeString(userNoteFrom.val());
    var timeTo = parseTimeString(userNoteTo.val());

    // Not entered anything
    if(timeFrom == undefined) {
        timeFrom = div.find('video')[0].currentTime;
        userNoteFrom.attr("placeholder", "Start: " + createTimeStringColons(timeFrom));
    }

    if(timeTo == undefined || timeTo < timeFrom) {
        timeTo = timeFrom + noteDuration;
        if(timeTo > div.find('video')[0].duration) {
            timeTo = Math.ceil(div.find('video')[0].duration);
        }
        userNoteTo.attr("placeholder", "Ende: " + createTimeStringColons(timeTo));
    }
}

function importUserNotes(videoContainer) {
    var idx = $('.elearnjs-video').index(videoContainer.find('.elearnjs-video'));

    var fileChoser = $('.user_note_import_filechoser');
    if(fileChoser.length == 0) {
        fileChoser = $('<input type="file" class="user_note_import_filechoser"/>');
        $('body').append(fileChoser);
        fileChoser.on('change', function(e) {
            var overwrite = confirm("Aktuelle Notizen können vor dem Import gelöscht und somit durch neue Notizen ersetzt werden.\r\n"
                + "'OK' zum Ersetzen, 'Abbrechen' zum Hinzufügen.");
            importFileChosen(videoContainer, e, overwrite);
            fileChoser.remove();
        });
    }
    fileChoser.trigger('click');
}

function exportUserNotes(videoContainer, type) {
    var idx = $('.elearnjs-video').index(videoContainer.find('.elearnjs-video'));
    var src = videoContainer.find('video').find('source').first()[0].src;
    var text;

    if(type === FILETYPE_JSON) {
        text = JSON.stringify(user_notes[src]);
    }
    else if(type === FILETYPE_CSV) {
        text = getCSVFromJSON(user_notes[src]);
    }

    download('user_notes_' + idx + '.' + type, text);
}

function importFileChosen(videoContainer, e, overwrite) {
    var src = videoContainer.find('video').find('source').first()[0].src;
    var files = e.target.files;
    var file = files[0];
    var type = file.name.split(".").pop();
    var reader = new FileReader();
    reader.onload = function(event) {
        try {
            var notes;
            if(type === FILETYPE_JSON) {
                notes = JSON.parse(event.target.result);
            }
            else if(type === FILETYPE_CSV) {
                notes = JSON.parse(getJSONFromCSV(event.target.result));
            }
            console.log(notes);
            user_notes[src] = notes;

            if(overwrite) videoContainer.find('.user_note').remove();

            var video_user_notes = getVideoNotesFor(src);
            // from back to front, since addNoteToUserNotes adds in front
            if(video_user_notes != undefined) {
                for(var i=video_user_notes.length-1; i>=0; i--) {
                    var user_note = video_user_notes[i];
                    addNoteToUserNotes(videoContainer,
                        createUserNote(user_note.text, user_note.timefrom, user_note.timeto));
                }
            }

            updateUserNotes(videoContainer);
            updateUserNotesArray(videoContainer);
            alert("Notizen erfolgreich importiert.");
        }
        catch(exc) {
            alert("Die Datei scheint nicht zum import geeignet zu sein.");
        }
    }
    reader.readAsText(file);
}

// ------------ Local Storage ----------

function loadLocalVideoNotesStorage() {
    var user_notes_str = localStorage.getItem('elearnjs-user-notes');
    if(user_notes_str === null
        || user_notes_str === undefined
        || user_notes_str == "") {
        localStorage.setItem('elearnjs-user-notes', '{}');
        user_notes_str = '{}';
    }
    user_notes = JSON.parse(user_notes_str);
}

function updateLocalVideoNotesStorage() {
    try {
        localStorage.setItem('elearnjs-user-notes', JSON.stringify(user_notes));
    }
    catch(e) {
        alert("Die letzte Notizänderung konnte nicht gespeichert werden, da der lokale Speicher voll ist.");
    }
}

function getVideoNotesFor(src) {
    return user_notes[src];
}

function setVideoNotesFor(src, val) {
    user_notes[src] = val;
    updateLocalVideoNotesStorage();
}

// User Note Menu

function createGeneralUserNoteMenu() {
    var dropDownCode = '<div class="user_note_dropdown general">'
        + '<div class="dropdown_element note_import">Notizen importieren</div>'
        + '<div class="dropdown_element note_export">Notizen exportieren als JSON</div>'
        + '<div class="dropdown_element note_export_csv">Notizen exportieren als CSV</div>'
        + '<div class="dropdown_element note_remove_all">Alle Notizen löschen</div>'
        + '</div>';
    $('body').append(dropDownCode);

    var dropDown = $('.user_note_dropdown.general');

    dropDown.find('.note_import').on('click', function() {
        importUserNotes(userNoteMenuNode.closest('.video-container'));
    });

    dropDown.find('.note_export').on('click', function() {
        exportUserNotes(userNoteMenuNode.closest('.video-container'), FILETYPE_JSON);
    });

    dropDown.find('.note_export_csv').on('click', function() {
        exportUserNotes(userNoteMenuNode.closest('.video-container'), FILETYPE_CSV);
    });

    dropDown.find('.note_remove_all').on('click', function() {
        if(confirm("Sollen wirklich alle Notizen dieses Videos dauerhaft gelöscht werden?")
            && userNoteMenuNode.is('.user_notes')) {
            userNoteMenuNode.find('.user_note').remove();
            updateUserNotes(userNoteMenuNode.closest('.video-container'));
            updateUserNotesArray(userNoteMenuNode.closest('.video-container'));
        }
    });
}

function createUserNoteMenu() {
    var dropDownCode = '<div class="user_note_dropdown">'
        + '<div class="dropdown_element edit">Bearbeiten</div>'
        + '<div class="dropdown_element delete">Löschen</div>'
        + '<div class="dropdown_element move_up">Nach oben bewegen</div>'
        + '<div class="dropdown_element move_down">Nach unten bewegen</div>'
        + '</div>';
    $('body').append(dropDownCode);

    var dropDown = $('.user_note_dropdown').not('.general');

    dropDown.find('.dropdown_element.edit').on('click', function(e) {
        userNoteMenuEdit();
    });
    dropDown.find('.dropdown_element.delete').on('click', function(e) {
        userNoteMenuDelete();
    });
    dropDown.find('.dropdown_element.move_up').on('click', function(e) {
        userNoteMenuMove(-1);
    });
    dropDown.find('.dropdown_element.move_down').on('click', function(e) {
        userNoteMenuMove(1);
    });
}

function hideUserNoteMenu() {
    $('.user_note_dropdown').hide();
}

function toggleUserNoteMenu(element) {
    element = $(element);
    var dropDown = $('.user_note_dropdown');
    var node = element.closest('.user_note');

    if($('.user_note_dropdown').length == 0) {
        createUserNoteMenu();
        createGeneralUserNoteMenu();
    }

    if(element.is('.general_user_note_menu')) {
        dropDown = $('.user_note_dropdown.general');
        node = element.closest('.user_notes'); // node is the container
    }
    else {
        dropDown = $('.user_note_dropdown').not('.general');
    }

    // hide other either way
    $('.user_note_dropdown').not(dropDown).hide();

    var align = false;

    // last edited accessed again
    if(node.is(userNoteMenuNode)) {
        if(dropDown.is(':visible')) {
            dropDown.hide();
        }
        else if(!dropDown.is(':visible')) {
            dropDown.show();
            align = true;
        }
    }
    // other node, always show
    else {
        dropDown.show();
        align = true;
    }

    // set position
    if(align) {
        dropDown.css({
            top: (element.offset().top - dropDown.outerHeight(true) + 28) + "px",
            left: (element.offset().left - dropDown.outerWidth(true)) + "px"
        });
    }

    userNoteMenuNode = node;
}

function userNoteMenuEdit() {
    var backup_note = userNoteMenuNode.siblings('#' + userNoteMenuNode.attr("id") + ".backup");
    var videoContainer = backup_note.closest('.video-container');

    editNote(videoContainer, backup_note);
}

function userNoteMenuDelete() {
    var backup_note = userNoteMenuNode.siblings('#' + userNoteMenuNode.attr("id") + ".backup");
    var videoContainer = backup_note.closest('.video-container');

    if(confirm("Soll diese Notiz wirklich dauerhaft gelöscht werden?")) {
        deleteNote(videoContainer, backup_note);
    }
}

function userNoteMenuMove(direction) {
    var backup_note = userNoteMenuNode.siblings('#' + userNoteMenuNode.attr("id") + ".backup");
    var videoContainer = backup_note.closest('.video-container');

    moveNote(videoContainer, userNoteMenuNode, backup_note, direction);
}


function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

// ================================ HELP =====================================

/**
* Übersetzt einen String in einen Integerwert in Sekunden.
* Dabei können Strings erkannt werden die aus Zahlen bestehen und den
* zugehörigen Einheiten h,m,s.
*
* Bsp: parseTimeString("01m15s") : 75
*/
function parseTimeString(str) {
    if(typeof str != typeof "string") return undefined;

    str = str.trim().toLowerCase();

    var seconds = undefined;

    // Style <HH>:<MM>:SS or S{n-times}
    if(str.match(/^(\d*:){0,2}\d+$/g)) {
        seconds = 0;
        str_parts = str.split(":");
        for(var i=0; i<str_parts.length && i<3; i++) {
            // from end to start
            var part = str_parts[str_parts.length - 1 - i];
            if(part.length > 0) {
                seconds += parseInt(part) * Math.pow(60, i);
            }
        }
    }
    // Style Xh Ym Zs
    else if(str.match(/^(\d+[hms]\s*)+$/g)){
        var factors = {
            "h":60*60,
            "m":60,
            "s":1
        };

        seconds = 0;
        var partTime = "";

        for(var i=0; i<str.length; i++) {
            var char = str.charAt(i);
            if(char.match(/\d/g)) {
                partTime += char;
            }
            else if(char.match(/[hms]/g)){
                seconds += parseInt(partTime, 10) * factors[char];
                partTime = "";
            }
            else if(char.match(/\S/g)){
                return undefined;
            }
        }
        if(partTime.length > 0) {
            seconds += parseInt(partTime, 10);
        }
    }


    return seconds;
}

function createTimeStringLetters(seconds) {
    var secLeft = seconds;

    var hours = parseInt(secLeft / 360);
    secLeft -= hours * 360;

    var minutes = parseInt(secLeft / 60);
    secLeft -= minutes * 60;

    return hours + "h" + minutes + "m" + seconds + "s";
}

function createTimeStringColons(seconds) {
    seconds = Math.floor(Math.abs(seconds));
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

    if(time_str.toLowerCase().match(/nan/g)) {
        time_str = "";
    }

    return time_str;
}
