/*
* video.js v0.1 - 17/02/03
* Ergänzend zum elearn.js v0.9.8
* JavaScript Quiz - by Arne Westphal
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
var video_timestyle = 0;

function initiateVideoPlayers() {
    $('video').each(function(i,e) {
        this.controls = false;
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
    initiateVideoNotes();
}

function addVideoPlayerListener(div) {
    eLearnJS.addTouchMouseChangeListener("video-mobile", switchTouchMouse);

    videoAddButtonListeners(div);
    videoAddUserInteractionListeners(div);
    videoAddProgressBarListeners(div);
    videoAddVolumeListeners(div);
    videoAddEventListeners(div);

    // fullscreen listeners
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
        event.preventDefault();
        event.stopPropagation();
        videoVolumeHover(div, event);
    });
    div.find('.volume').on('mouseleave', function(event) {
        event.preventDefault();
        event.stopPropagation();
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
        if(!eLearnJS.isTouchSupported()) {
            videoHover(div);
        }
    });
    div.on('mouseup touchend', function(event) {
        if(event.type === "touchend" || event.button == 0) {
            // other listeneres take care of these
            if(videoMouseDown || videoVolumeMouseDown
                || $(event.target).is('.bottom-row') || $(event.target).is('.bottom-row *')
                || $(event.target).is('.play-overlay') || $(event.target).is('.play-overlay *')
                || $(event.target).is('.mobile-overlay .playpause')
                || $(event.target).is('.error-con') || $(event.target).is('.error-con *')) {
                return true;
            }

            // necessary for the video to not stop on touch
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
    div.on('mouseout', function(event) {
        if(!eLearnJS.isTouchSupported()) {
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
    $(document).on('mouseup touchend', function(event) {
        if(videoVolumeMouseDownTarget != null) {
            event.preventDefault();
            event.stopPropagation();
            setVideoVolumeMouseDown(videoVolumeMouseDownTarget, false, event);
        }
    });
}

function videoAddEventListeners(div) {
    // listener to video progress
    div.find('video').on('ended', function(event) {
        videoHover(div);
    });
    div.find('video').on('timeupdate progress', function(event) {
        updateVideoTime(div);
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
    if(trgt.is('.mobile-overlay *')) {
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
    if(!(vid.paused && eLearnJS.isTouchSupported())) {
        video_hover_timers[idx] = setTimeout(function(){
            if(videoMouseDown || videoVolumeMouseDown) {
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
        div.addClass("hovered");
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


var secSwipeBefore;

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
        secSwipeBefore = eLearnJS.isSectionSwipeEnabled();
        eLearnJS.generalSectionSwipeEnabled(false);
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
        if(secSwipeBefore != undefined) {
            eLearnJS.generalSectionSwipeEnabled(secSwipeBefore);
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

    if(eLearnJS.isTouchSupported()) {
        event.preventDefault();
        event.stopPropagation();
        videoSetVolumeControlOpen(div, !div.find('.volume').is('.controlopen'));
    }
    else if($(e.target).is('.icon') && !videoVolumeMouseDown) {
        event.preventDefault();
        event.stopPropagation();
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

/**
* Called when hovering over the volume icon
* shouldn't do anything on touch devices, because they have no hover
*/
function videoVolumeHover(div, event) {
    if(!eLearnJS.isTouchSupported()) {
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
        if(!withinVolumeControl && !eLearnJS.isTouchSupported()) {
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
    }
}

// PROGRESSBAR ----------------------------------------------

var videoMouseDownTarget = null;
var videoMouseDown = false;
var videoSpeedBefore = 1;

function setVideoMouseDown(div, b) {
    var vid = div.find('video')[0];
    if(b && !videoMouseDown) {
        videoMouseDownTarget = div;
        videoSpeedBefore = vid.playbackRate;
        vid.playbackRate = 0;
        div.find('.video-progress-bar').addClass('notransition');
        div.find('.video-progress-pointer').addClass('notransition');
    }
    else if(!b && videoMouseDown) {
        if(videoSpeedBefore != vid.playbackRate) {
            videoMouseDownTarget = null;
            vid.playbackRate = videoSpeedBefore;
        }
        div.find('.video-progress-bar')[0].offsetHeight;
        div.find('.video-progress-pointer')[0].offsetHeight;
        div.find('.video-progress-bar').removeClass('notransition');
        div.find('.video-progress-pointer').removeClass('notransition');
        updateVideoTime(div);
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

    videoHover(div);

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

    if(videoMouseDown) {
        // change position without transition effect
        div.find('.video-progress-bar').css("width", pos_perc*100 + "%");
        div.find('.video-progress-pointer').css("left", pos_perc*100 + "%");
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
    if(!videoMouseDown) {
        time_field.html(timeToString(time));
        if(video_timestyle === video_timetypes.TIMELEFT) {
            if(!isNaN(timeleft)) timeleft_field.html("-" + timeToString(timeleft));
        }
        else if(video_timestyle === video_timetypes.DURATION) timeleft_field.html(timeToString(vid.duration));
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



function timeToString(seconds) {
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

function resizeAllVideoPlayers() {
    $('.elearnjs-video:visible').each(function(i,e) {
        resizeVideoPlayer($(this));
    });
}


function resizeVideoPlayer(div) {

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

    div.find('.controls').find('.bottom-row').children(':visible').each(function(i,e) {
        if(!$(this).is('.video-progress-con')) {
            icon_width += $(this).outerWidth(true);
        }
    });

    var progress_width = div.find('.bottom-row').width() - icon_width - 5
                        - parseInt(div.find('.video-progress-con').css("margin-left").replace("px", ""))
                        - parseInt(div.find('.video-progress-con').css("margin-right").replace("px", ""));
    div.find('.video-progress-con').css("width", progress_width + "px");
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

    // create list with sorted times for faster checking if something needs to be shown
    $('.elearnjs-video').each(function(i,e) {
        var videoNotes = $(this).next('.video_notes');

        $(this).wrap('<div class="video_container">');
        $(this).parent().append(videoNotes);

        videoNoteTimes[i] = getVideoNoteTimeArray(videoNotes);

        $(this).find('video').on('timeupdate', function(event) {
            noteTimeUpdate(event, $(e), videoNotes, i);
        });
        addNotesToProgressbar($(e), i);
    });
}

function addNotesToProgressbar(div, index) {
    var vid = div.find('video')[0];
    var length = vid.duration;

    if(vid.readyState == 0) {
        setTimeout(function() {addNotesToProgressbar(div, index);}, 100);
    }
    else {
        for(var i=0; i<videoNoteTimes[index].length; i++) {
            var info = videoNoteTimes[index][i];
            var start = info['time'];

            var progress_note = $('<div class="video-progress-note">');
            progress_note.css('left', (start*100)/length + "%");
            div.find('.video-progress').after(progress_note);
        }
    }

}

/**
* Wird beim timeupdate event eines videos ausgeführt. Blendet notes ein oder aus
*/
function noteTimeUpdate(event, div, notes_con, index) {
    var vid = div.find('video')[0];
    var time = vid.currentTime;

    for(var i=0; i<videoNoteTimes[index].length; i++) {
        var info = videoNoteTimes[index][i];
        if(info["time"] > time) {
            // remove
            notes_con.find('.video_note').filter('#'+info["index"]).remove();
        }
        else if(info["time"] < time) {
            if(info["time_to"] != undefined
                && info["time_to"] != -1
                && info["time_to"] <= time) {
                // remove
                notes_con.find('.video_note').filter('#'+info["index"]).remove();
            }
            else {
                // skip if already shown
                if(notes_con.find('.video_note#'+info["index"]).length > 0) continue;
                // create new node
                var original_note = notes_con.find('.video_note.backup').eq(info["index"]);
                var new_note = original_note.clone();
                new_note.removeClass('backup');
                new_note.attr('id', info["index"]);

                // timestamp if activated
                if(notes_con.is('.timestamps')) {
                    new_note.prepend('<span class="video_note_timestamp">'
                                        +timeToString(info["time"])+'</span>');
                }
                original_note.after(new_note);
            }
        }
        checkVisibleNotes(div, notes_con);
    }
}

function checkVisibleNotes(div, notes_con) {
    if(notes_con.find('.video_note').not('.backup').length > 0) {
        div.parent().addClass('noted_video');
    }
    else {
        div.parent().removeClass('noted_video');
    }
}

/**
* Erstellt ein sortiertes Array mit Objekten die einen Index haben, der auf ein
* .video_note objekt hinweist, eine anfangszeit time und ggf. eine time_to.
* Sortiert ist das Array nach dem key "time"
*/
function getVideoNoteTimeArray(div) {
    var times = [];
    div.find('.video_note').each(function(i,e) {
        var timeFrom = $(this).attr('timefrom');
        var timeTo = $(this).attr('timeto');
        if(timeTo == undefined) timeTo = -1;
        times.push({"time" : timeStringToSeconds(timeFrom),
                    "time_to" : timeStringToSeconds(timeTo),
                    "index" : i});
    });
    times.sort(function(a,b) {
        return a["time"]-b["time"];
    });
    return times;
}

/**
* Übersetzt einen String in einen Integerwert in Sekunden.
* Dabei können Strings erkannt werden die aus Zahlen bestehen und den
* zugehörigen Einheiten h,m,s.
*
* Bsp: timeStringToSeconds("01m15s") : 75
*/
function timeStringToSeconds(str) {
    if(typeof str != typeof "string") return undefined;

    var factors = {
        "h":60*60,
        "m":60,
        "s":1
    };

    str = str.toLowerCase();

    var seconds = 0;
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
    return seconds;
}
