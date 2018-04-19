/*
* video.js v0.4.0 - 18/04/16
* Ergänzend zum elearn.js v1.0.1
* JavaScript Videoplayer - by Arne Westphal
* eLearning Buero MIN-Fakultaet - Universitaet Hamburg
*/
(function() {

/**
* Initialisiert die Videoplayer
*/
$(document).ready(function() {
    initiateTouchDetection();
    initiateVideoPlayers();
});

// ----------------------------------------------------------------------------
// ------------------------- VIDEO PLAYER -------------------------------------
// ----------------------------------------------------------------------------

var video_hover_timers = {};
var video_volumes = {};
var video_timetypes = {
    TIMELEFT : 0,
    DURATION : 1
};
var FILETYPE_JSON = 'json';
var FILETYPE_CSV = 'csv';
var video_timestyle = 0;
var touchend_block = false;
var touchend_timer = null;

var user_notes = {};

/**
* Initiates all videoplayers, by adding wrapper around <video> elements.
* Also initiates all listeners and everything necessary, so that the players
* work correctly.
*/
function initiateVideoPlayers() {
    loadLocalVideoNotesStorage();

    $('video').not('.ignore_elearnvideo').each(function(i,e) {
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

    // only fallback values, should work without this resizes,
    // based on IntersectionObserver support
    document.addEventListener("ejssectionchange", resizeAllVideoPlayers);
    window.addEventListener("ejswindowresize", resizeAllVideoPlayers);
    $(window).resize(resizeAllVideoPlayers);
    // Used to explicitly set video-note width to equal video width
    window.addEventListener("ejsvideotouchmousechange", switchTouchMouse);
    initiateVideoNotes();
}

function initListeners() {
    $('.elearnjs-video').each(function(i, e) {
        const el = $(e);
        try {
            var options = {
                root: document.body,
                rootMargin: '0px',
                threshold: 1.0
            }

            var observer = new IntersectionObserver(function(entries, observer) {
                for(var entry of entries) {
                    resizeVideoPlayer($(entry.target));
                }
            }, options);

            observer.observe(el.get(0));
        } catch(e) {
            // ignore
        };
        // resizesensor as visibility listener this will only work with Chrome engine browsers
        try {
            new ResizeSensor(el, function(dim) {
                resizeVideoPlayer(el);
            });
        } catch(e) {
            // ignore
        };
    });
}

/**
* Add general video player listeners. These are listeners which are not on the
* player itself but on the document.
*/
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

/**
* Adds all video player specific listeners. So every listener which is appended
* on a single video element or the wrapper of it.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
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

    // stop propagation at div in fullscreen, event not triggert in any parent
    div.on('blur change click contextmenu copy cut dblclick error foxus focusin focusout '
        + 'keydown keypress keyup load mousedown mouseenter mouseleave mousemove '
        + 'mouseout mouseover mouseup mousewheel paste reset resize scroll '
        + 'select submit textinput unload wheel '
        + 'orientationchange pointerdown pointermove pointerup '
        + 'touchstart touchmove touchend ', function(e) {
        if(div.is('.full')) {
            e.stopPropagation();
        }
    });
}

/**
* Adds listeners to buttons within the video player.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
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

/**
* Adds listeners to other player interaction. E.g. clicks on the video
* or touch events which are not targeted at a button.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
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

/**
* Adds listeners to the progress bar. E.g. for time skipping and hover events.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
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

/**
* Adds listeners to the volume bar. For volume changes.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
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

/**
* Adds all events based on the exact video element. E.g. timeupdate/playpause
* @param div: the .elearnjs-video Wrapper of the video element.
*/
function videoAddEventListeners(div) {
    var video = div.find('video');
    // listener to video progress
    video.on('ended', function(event) {
        videoHover(div);
    });
    video.on('timeupdate progress', function(event) {
        updateVideoTime(div);
        updateVideoUserNoteTime(div);
    });
    video.on('play', function(event) {
        videoUpdatePlayPauseButton(div);
    });
    video.on('pause', function(event) {
        videoUpdatePlayPauseButton(div);
    });
    video.on('volumechange', function(event) {
        updateVideoVolume(div);
    });
    video.on('error abort', function(event) {
        videoOnError(div, event);
    });
    video.on('canplay', function(event) {
        videoRemoveError(div, event);
        videoRemoveBuffering(div);
    });
    video.on('waiting', function(event) {
        videoOnBuffering(div, event);
    });
    video.on('resize', function(event) {
        resizeVideoPlayer(div);
    });
    videoCheckDelayedError(div);
}


/**
* Checks for browser specific adjustments to the video player.
* E.G. mobile safari does not allow volume changes. These elements are hidden.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
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

/**
* Toggles the hover overlay of one specific video wrapper.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
function videoToggleHover(div) {
    if(div.is('.hovered')) {
        videoHoverEnd(div);
    }
    else {
        videoHover(div);
    }
}

/**
* Checks if the videoHover should be refreshed based on the given events target.
* Refreshes the hover if so.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
function videoRefreshHover(div, event) {
    var trgt = $(event.target);
    if(trgt.is('.mobile-overlay *') || trgt.is('.controls *')) {
        videoHover(div);
    }
}

/**
* Sets a video player hovered. Will show the controls overlay.
* Initiates a timeout for automatic hiding of the overlay after a hard coded
* time.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
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

/**
* Removes the hover overlay for a specific video player.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
function videoHoverEnd(div) {
    var vid = div.find('video')[0];
    if(!vid.ended) {
        div.removeClass("hovered");
    }
}

// FULLSCREEN -----------------------------------------------

/**
* Checks if the browser is in fullscreen mode. If not all video players are
* reset to normal display mode.
*/
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

/**
* Called when clicked on a video.
* This will pause or check for double click and set the video to fullscreen/back
* @param div: the .elearnjs-video Wrapper of the video element.
*/
function videoOnClick(div) {
    var dblclick_time = 250;
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

/**
* Toggles play for a video player. Updates the playpause button
* @param div: the .elearnjs-video Wrapper of the video element.
*/
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

/**
* Updates the play/pause button based on the video play-status.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
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

/**
* Toggles between the display of timeleft (e.g. -0:12) and the videos duration
* (e.g. 0:28, static)
*/
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

/**
* Toggles fullscreen for a video player.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
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

// VOLUME --------------------------------------------------

var withinVolumeControl = false;
var videoVolumePending = {};
var videoVolumeMouseDown = false;
var videoVolumeMouseDownTarget = null;

/**
* Called when clicked on the volume icon
* should open volume control on touch devices and mute/unmute otherwise
* @param div: the .elearnjs-video Wrapper of the video element.
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
* @param div: the .elearnjs-video Wrapper of the video element.
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
* @param div: the .elearnjs-video Wrapper of the video element.
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
* @param div: the .elearnjs-video Wrapper of the video element.
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
* @param div: the .elearnjs-video Wrapper of the video element.
* @param e: the event occured initiating this. (mousedown/touchstart...)
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
* @param div: the .elearnjs-video Wrapper of the video element.
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

/**
* Processes a keypress event on a video player. The player needs to be target
* of the event so this is triggered. (e.g. Space to toggle play/pause)
* @param div: the .elearnjs-video Wrapper of the video element.
*/
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

/**
* Sets video mouse down state enabled or disabled.
* Used the progress mousemove/touchmove events on the player
* @param div: the .elearnjs-video Wrapper of the video element.
*/
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

/**
* Processes a mouse enter event on the progress bar.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
function videoProgressMouseEnter(div, e) {
    var con = div.find('.video-progress-con');
    var back = con.find('.video-progress');
    back.append('<div class="video-progress-hover">');
    div.append('<div class="progress-hover-time"></div>');
    videoOverProgress = true;
}

/**
* Processes a mouse leave event on the progress bar.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
function videoProgressMouseLeave(div, e) {
    var con = div.find('.video-progress-con');
    con.find('.video-progress-hover').remove();
    if(!videoProgressMouseDown) div.find('.progress-hover-time').remove();
    videoOverProgress = false;
}

/**
* Processes a mouse move event on the video player if either the event is
* targeted at the progressbar or the state videoProgressMouseDown is true.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
function videoProgressMouseMove(div, e) {
    var vid = div.find('video')[0];
    if(videoOverProgress || videoProgressMouseDown) {
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

/**
* Updates the video time. Will set the time indicator and progressbar width
* to values based on the video elements currentTime
* @param div: the .elearnjs-video Wrapper of the video element.
*/
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

/**
* Processes a video error. Will show an error overlay.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
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

/**
* Will hide a video error overlay
* @param div: the .elearnjs-video Wrapper of the video element.
*/
function videoRemoveError(div, event) {
    div.find('.error-con').remove();
}

/**
* Checks for a delayed error. Will check after 1s.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
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

/**
* Displays a loading indicator when a buffer event is triggered.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
function videoOnBuffering(div, event) {
    if(div.find('.play-overlay').length == 0) {
        if(div.is('.mobile')) div.find('.mobile-overlay').hide();
        div.find('.loading-overlay').show();
    }
}

/**
* Hides the loading indicator, when the video is not buffering anymore.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
function videoRemoveBuffering(div, event) {
    if(div.find('.play-overlay').length == 0) {
        if(div.is('.mobile')) div.find('.mobile-overlay').show();
        div.find('.loading-overlay').hide();
    }
}

/**
* Resizes all video Players. Will call resizeVideoPlayer simply on all
* .elearnjs-video elements.
*/
function resizeAllVideoPlayers() {
    $('.elearnjs-video:visible').each(function(i,e) {
        resizeVideoPlayer($(this));
    });
}

/**
* Recalculates video note container widths. for every video.
*/
function resizeVideoPlayer(div) {
    var videoContainer = div.closest('.video-container');
    videoContainer.find('.video_notes_wrapper').css("width", div.find('video').width());
}

/**
* Switches the video player style between mouse and touch for easier control.
* Will be triggered on delayed switches between those based on events.
* @param div: the .elearnjs-video Wrapper of the video element.
*/
function switchTouchMouse() {
    if(isTouchSupported()) {
        $('.elearnjs-video').addClass("mobile");
    }
    else {
        $('.elearnjs-video').removeClass("mobile");
    }
}

// ------------------------- VIDEO NOTES ------------------------------------

var videoNoteTimes = [];

/**
* Initializes the time notes for all video players.
* Will be called in the generell video player initiation.
* Players can have the class "allow_user_notes" which lets them define if
* the allow user notes (class is set) or not (class is not set).
*/
function initiateVideoNotes() {
    $('.video_note').addClass('backup');
    $('.video_note').wrapInner('<div class="content">');

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

/**
* Creates and returns a user video notes container
*/
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

/**
* Adds the "show all notes" checkbox to a notes container.
*/
function addShowAllTo(notes) {
    notes.prepend('<label class="show_all_notes"><input type="checkbox" name="show_all" value="show_all"/>Alle einblenden</label>');
    notes.find('input[name="show_all"]').on('change', function(e) {
        showAllNotes(notes, $(this).is(':checked'));
    });
}

/**
* Adds the user Note Menu to the user note container.
*/
function addUserNoteMenuTo(notes) {
    var div = $('<div class="user_note_menu_wrap general_user_note_menu"><div class="user_note_menu">m</div></div>');
    div.on('click', function() {
        toggleUserNoteMenu(this);
    });
    notes.prepend(div);
}

/**
* Enables or disables the display of all video notes in the specific notes
* container.
*/
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
        hideAllVideoNotes(notes);
        noteTimeUpdate(videoContainer, notes, idx);
    }
}

/**
* Checks if show all is activated. Will display all notes if so.
* Will NOT hide others if not.
*/
function checkShowAll(notes_con) {
    notes_con.find('.note_container').each(function(i,e) {
        if($(this).is('.show_all')) {
            showAllNotes($(this), true);
        }
    });
}

/**
* Adds note indicators to the videos progressbar
* @param videoContainer: the .video-container wrapper around the video
*/
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
* @param videoContainer: the .video-container wrapper around the video
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
                hideVideoNote(notes_con, display_note);
            }
            else if(info["time"] <= time) {
                // note ended
                if(info["time_to"] != undefined
                    && info["time_to"] != -1
                    && info["time_to"] <= time) {
                    // remove
                    hideVideoNote(notes_con, display_note);
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

/**
* Displays a video note specified by its @param info object within the
* @param notes_con notes container.
*/
function showVideoNote(notes_con, info) {
    var original_note = notes_con.find('.video_note.backup').filter('#'+info["index"]);
    var new_note = original_note.clone(true, true); // clone with all listeners
    new_note.removeClass('backup');
    //new_note.attr('id', info["index"]);

    // timestamp if activated
    if(original_note.closest('.note_container').is('.timestamps')) {
        new_note.prepend('<span class="video_note_timestamp">'
                            +createTimeStringColons(info["time"])+'</span>');
    }
    // add user note menu button
    if(original_note.is('.user_note')) {
        var div = $('<div class="user_note_menu_wrap"><div class="user_note_menu">m</div></div>');
        div.on('click', function() {
            toggleUserNoteMenu(this);
        });
        new_note.prepend(div);
    }
    original_note.after(new_note);
}

/**
* Hides a @param display_note displayed note within a @param notes_con notes
* container.
*/
function hideVideoNote(notes_con, display_note) {
    var backup_note = display_note.siblings('#' + display_note.attr("id") + ".backup");
    backup_note.empty();
    backup_note.append(display_note.find('.content'));
    display_note.remove();
}

/**
* Hides all video notes within a specific container.
*/
function hideAllVideoNotes(notes_con) {
    notes_con.find('.video_note').not('.backup').each(function(i,e) {
        hideVideoNote(notes_con, $(this));
    });
}

/**
* Checks if atleast one note is displayed. Sets the
* @param videoContainer's class based on that.
*/
function checkVisibleNotes(videoContainer, notes_con) {
    if(notes_con.find('.video_note').not('.backup').length > 0) {
        videoContainer.parent().addClass('noted_video');
    }
    else {
        videoContainer.parent().removeClass('noted_video');
    }
}

var lastIndexSet = -1;

/**
* Erstellt ein sortiertes Array mit Objekten die einen Index haben, der auf ein
* .video_note objekt hinweist, eine anfangszeit time und ggf. eine time_to.
* Sortiert ist das Array nach dem key "time"
* @param videoContainer: the .video-container wrapper around the video
*/
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

/**
* Initiates the general user note functionality by adding global event
* listeners.
*/
function initiateUserNotes() {
    addUserNoteListeners();
}
/**
* Adds general listeners used for user note functionality
*/
function addUserNoteListeners() {
    $(document).on('click', function(e) {
        if($('.user_note_dropdown').length > 0
            &&!$(e.target).is('.user_note_menu_wrap')
            && !$(e.target).is('.user_note_menu_wrap *')) {
            hideUserNoteMenu();
        }
    });
}

/**
* Updates all displayed values based on the notes withing the videoContainers
* user note container.
* Updates internal array info values about notes, adds notes to progressbar,
* hides/shows necessary notes.
* @param videoContainer: the .video-container wrapper around the video
*/
function updateUserNotes(videoContainer) {
    // fetch existing video notes
    var notes_con = videoContainer.find('.video_notes_container');
    var idx = $('.elearnjs-video').index(videoContainer.find('.elearnjs-video'));
    videoNoteTimes[idx] = getVideoNoteTimeArray(notes_con);
    hideAllVideoNotes(notes_con);
    noteTimeUpdate(videoContainer, notes_con, idx);
    checkShowAll(notes_con);
    addNotesToProgressbar(videoContainer, idx);
}

/**
* Adds listeners for the user note add functionality
* @param videoContainer: the .video-container wrapper around the video
*/
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

/**
* Shows/Hides the "add user note"-container.
*/
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

/**
* Creates the user note dom element based on the necessary values.
* @param text: the note text
* @param timefrom: time where the note will be displayed
* @param timeto: time where the note will be hidden
* @param id: the id within the current note context. This might be set later
*   by other functions. (e.g. getVideoNoteTimeArray)
*/
function createUserNote(text, timefrom, timeto, id) {
    return $('<div class="video_note backup user_note" timefrom="'
                    + createTimeStringLetters(parseTimeString(timefrom))
                    + '" timeto="'
                    + createTimeStringLetters(parseTimeString(timeto))
                    + '" id="' + id + '">'
                    + '<div class="content">' + text + '</content>'
                    + '</div>');
}

/**
* Appends a given @param note dom element to the user notes within the videoContainer
* @param videoContainer: the .video-container wrapper around the video
*/
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

/**
* Processes the input in the note add container.
* Will add/save the note if input is correct.
* @param videoContainer: the .video-container wrapper around the video
*/
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

/**
* Called when a dispalyed note is edited (ui call by the user)
* @param videoContainer: the .video-container wrapper around the video
* @param note: the BACKUP note of the edited note.
*/
function editNote(videoContainer, note) {
    editingDiv = videoContainer;
    editingNote = note;

    var text = editingNote.find('.content').html().trim().replace(/<br>/g, "\r\n");

    videoContainer.find('.note_add_container').find('.user_note_from').val(createTimeStringColons(parseTimeString(editingNote.attr("timefrom"))));
    videoContainer.find('.note_add_container').find('.user_note_to').val(createTimeStringColons(parseTimeString(editingNote.attr("timeto"))));
    videoContainer.find('.note_add_container').find('textarea').val(text);

    setVideoNotesAddContainerVisible(videoContainer, true);
}

/**
* Resets the note add container values and the editing variables.
* @param videoContainer: the .video-container wrapper around the video
*/
function cancelEdits(videoContainer) {
    videoContainer.find('.note_add_container').find('.user_note_from').val("");
    videoContainer.find('.note_add_container').find('.user_note_to').val("");
    videoContainer.find('.note_add_container').find('textarea').val("");
    editingDiv = null;
    editingNote = null;
}

/**
* Deletes a given user note completely within the storage and from the dom
* @param videoContainer: the .video-container wrapper around the video
* @param note: the backup note (might be the displayed note, because only
*   ID is necessary)
*/
function deleteNote(videoContainer, note) {
    videoContainer.find('.user_note').filter('#' + note.attr('id')).remove();

    updateUserNotes(videoContainer);
    updateUserNotesArray(videoContainer);
}

/**
* Moves a note within the array and dom up or down one step.
* Used to make it possible to arrange the user notes.
* @param videoContainer: the .video-container wrapper around the video
* @param display_note: the displayed version of the note to move
* @param backup_note: the backup version of the note to move
* @param direction: -1: up, 1: down
*/
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

/**
* Creates a user note array for the videoContainer, containing necessary info
* updates this in the local storage.
* @param videoContainer: the .video-container wrapper around the video
*/
function updateUserNotesArray(videoContainer) {
    var src = videoContainer.find('video').find('source').first()[0].src;
    var user_video_notes = [];
    videoContainer.find('.user_notes').find('.user_note.backup').each(function(i, e) {
        var text = $(this).find('.content').html();
        var video_note_object = {timefrom: $(this).attr('timefrom'),
                                timeto: $(this).attr('timeto'),
                                text: text};
        user_video_notes.push(video_note_object);
    });
    setVideoNotesFor(src, user_video_notes);
}

/**
* Updates the placeholder of the time values within the note add container,
* based on the current video time.
* @param div: the .elearnjs-video wrapper around the video
*/
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

/**
* Starts the import notes process. Opening a filechoser for the user to
* insert a file of exported user notes.
* This can be .json or .csv files.
* @param videoContainer: the .video-container wrapper around the video
*/
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

/**
* Exports the usernotes to a given filetype. Offers the user a download of
* the generated file.
* @param videoContainer: the .video-container wrapper around the video
* @param type: either FILETYPE_JSON or FILETYPE_CSV
*/
function exportUserNotes(videoContainer, type) {
    var idx = $('.elearnjs-video').index(videoContainer.find('.elearnjs-video'));
    var src = videoContainer.find('video').find('source').first()[0].src;
    var text;

    if(user_notes[src] == undefined || user_notes[src].length == 0) {
        alert("Keine Notizen vorhanden.");
        return;
    }

    if(type === FILETYPE_JSON) {
        text = JSON.stringify(user_notes[src]);
    }
    else if(type === FILETYPE_CSV) {
        text = getCSVFromJSON(user_notes[src]);
    }

    download('user_notes_' + idx + '.' + type, text);
}

/**
* Processes the import file. This will be called, when the filechoser
* returns a chosen file.
* @param videoContainer: the .video-container wrapper around the video
* @param e: the filechoser change event
* @param overwrite: wether current user notes should be deleted (true) or
* imported notes should be appended (false)
*/
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

/**
* Loads the user notes from localstorage.
* Will set the "user_notes" object based on that value.
*/
function loadLocalVideoNotesStorage() {
    try {
        var user_notes_str = localStorage.getItem('elearnjs-user-notes');
        if(user_notes_str === null
            || user_notes_str === undefined
            || user_notes_str == "") {
            localStorage.setItem('elearnjs-user-notes', '{}');
            user_notes_str = '{}';
        }
        user_notes = JSON.parse(user_notes_str);
    }
    catch(e) {
        console.log("LocalStorage konnte nicht geladen werden");
    }

}

/**
* Will save the current "user_notes" object in the local storage.
*/
function updateLocalVideoNotesStorage() {
    try {
        if(!localStorage) return;
    }
    catch(e) {
        console.log("Zugriff auf localStorage wurde verweigert.");
    }
    try {
        localStorage.setItem('elearnjs-user-notes', JSON.stringify(user_notes));
    }
    catch(e) {
        alert("Die letzte Notizänderung konnte nicht gespeichert werden, da der lokale Speicher voll ist.");
    }
}

/**
* Returns the video notes array for the specified video src.
*/
function getVideoNotesFor(src) {
    return user_notes[src];
}

/**
* Saves the given video notes array (@param val) for the specified video src
* in the local storage and updates the "user_notes" object.
*/
function setVideoNotesFor(src, val) {
    user_notes[src] = val;
    updateLocalVideoNotesStorage();
}

// User Note Menu

/**
* Creates the user note container menu for import/export ...
* This element will be displayed and positioned on click of the menu button.
*/
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

/**
* Creates the user note drop down menu for edit/delete...
* This element will be displayed and positioned on click of the menu button.
*/
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

/**
* Hides the user note menu
*/
function hideUserNoteMenu() {
    $('.user_note_dropdown').hide();
}

/**
* Toggles the user note menu note.
* @param element: the user note menu button dom element.
*/
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

/**
* Processes the click on the edit option of a user note.
*/
function userNoteMenuEdit() {
    var backup_note = userNoteMenuNode.siblings('#' + userNoteMenuNode.attr("id") + ".backup");
    var videoContainer = backup_note.closest('.video-container');

    editNote(videoContainer, backup_note);
}

/**
* Processes the click on the delete option of a user note.
*/
function userNoteMenuDelete() {
    var backup_note = userNoteMenuNode.siblings('#' + userNoteMenuNode.attr("id") + ".backup");
    var videoContainer = backup_note.closest('.video-container');

    if(confirm("Soll diese Notiz wirklich dauerhaft gelöscht werden?")) {
        deleteNote(videoContainer, backup_note);
    }
}

/**
* Processes the click on the move option of a user note.
* @param direction: -1: up, 1: down
*/
function userNoteMenuMove(direction) {
    var backup_note = userNoteMenuNode.siblings('#' + userNoteMenuNode.attr("id") + ".backup");
    var videoContainer = backup_note.closest('.video-container');

    moveNote(videoContainer, userNoteMenuNode, backup_note, direction);
}

/**
* Generates a text file and offers it for download.
* @param filename: the filename
* @param text: the files text content
*/
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
* Außerdem können mit : getrennte Zeiten erkannt werden.
*
* Bsp: parseTimeString("01m15s") : 75
* Bsp: parseTimeString("01:15") : 75
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

/**
* Generates a letter style time string. E.g. "1m15s"
* @param seconds: integer value of seconds
*/
function createTimeStringLetters(seconds) {
    var secLeft = seconds;

    var hours = parseInt(secLeft / 360);
    secLeft -= hours * 360;

    var minutes = parseInt(secLeft / 60);
    secLeft -= minutes * 60;

    return hours + "h" + minutes + "m" + seconds + "s";
}

/**
* Generates a colon style time string. E.g. "01:15"
* @param seconds: integer value of seconds
*/
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

function initiateTabbedBox(box) {
    var div = box;

    div.wrap('<div class="tabbed-container"></div>');

    div.before('<div class="tabs"></div>');

    var tabs = div.parent().find('.tabs');

    div.find('.tab').each(function() {
        var tab = $(this);
        var tabSelect = $('<div class="tab-select">' + tab.attr('name') + '</div>');
        tabSelect.on('click', function(e) {
            selectTab(this);
        });
        tabs.append(tabSelect);
    });

    // set active tab to first
    div.find('.tab').hide();
    div.find('.tab').first().show();
    tabs.find('.tab-select').first().addClass('act');
}

/**
* Selects a tab of a tabbed box
* @param elemt, the tab element clicked on
* @event: Fires "ejstabchange"event on the .tabbed-container when done successfully.
*/
function selectTab(element) {
    var e = $(element);
    var div = e.parent().nextAll().first('.tabbed-box');

    var tabbefore = div.find('.tab:visible').attr("name");

    // show only new
    div.find('.tab').hide();
    div.find('.tab').filter('[name="' + e.html() + '"]').show();
    e.parent().find('.tab-select').removeClass("act");
    e.addClass("act");

    var eventObj = {
        "tab": e.html(),
        "tabbefore" : tabbefore};
    fireEvent(div.closest('.tabbed-container')[0], createEvent("ejstabchange", eventObj));
}

var touchSupported = false;
var touchMouseChangeTimer = null;
var lastTouch = undefined;

/**
* Simply returns the current touchSupported var value
* This value will not really return if touch is supported, but if it is
* actively used. So it returns if the last event was a touch event or a mouse
* was used. This way it can swap, based on the users preference.
*/
function isTouchSupported() {
    return touchSupported;
}

/**
* Initiates the touch detection.
* This will set listeners to specific events which can detect
*/
function initiateTouchDetection() {
    $(document).bind('touchstart', function(event) {
        lastTouch = new Date().getTime();
        clearTimeout(touchMouseChangeTimer);
        if(!touchSupported) {
            touchSupported = true;
            touchSupportedChanged();
        }
    });
    $(document).bind('mousemove', function(event) {
        // asynchronous for touch events fired afterwards
        touchMouseChangeTimer = setTimeout(function() {
            // more than 2s ago
            if(touchSupported && lastTouch < new Date().getTime() - 2000) {
                touchSupported = false;
                touchSupportedChanged();
            }
        }, 200);
    });
}

/**
* Will call all functions registered on touchSupportedChanged
* @event: Fires "ejsvideotouchmousechange" event on the window when done successfully.
*/
function touchSupportedChanged() {
    fireEvent(window, createEvent("ejsvideotouchmousechange", {}));
}

function createEvent(eventName, eventObj) {
    var event; // The custom event that will be created

    if (document.createEvent) {
      event = document.createEvent("HTMLEvents");
      event.initEvent(eventName, true, true);
    } else {
      event = document.createEventObject();
      event.eventType = eventName;
    }

    event.eventName = eventName;

    $.each(eventObj, function(k,v) {
        event[k] = v;
    });

    return event;
}

function fireEvent(element, event) {
    if (document.createEvent) {
      element.dispatchEvent(event);
    } else {
      element.fireEvent("on" + event.eventType, event);
    }
}

})();
