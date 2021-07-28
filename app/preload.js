
const YouTube = require('youtube-sr').default;
const ytdl = require('ytdl-core');
window.ytdl = ytdl;
const {Howl, Howler} = require('howler');
const execSync = require("child_process").execSync;
const exec = require("child_process").exec;


var playlist = null;
var queue = [];
var player = null;
var updateSongProgressInterval = null;

function shuffleArray(array) {
    // https://stackoverflow.com/a/12646864
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function shuffleQueue() {
    if (queue.length <= 0) {
        return [];
    }
    let tempArray = queue.slice(1);
    tempArray = shuffleArray(tempArray);
    tempArray.unshift(queue[0]);
    queue = tempArray;
}

function showControls() {

    document.getElementById('load-playlist-button').disabled = true;

    document.getElementById('player-controls').hidden = false;

    let playButton = document.getElementById('play-button');
    let pauseButton = document.getElementById('pause-button');
    let skipButton = document.getElementById('skip-button');
    let shuffleButton = document.getElementById('shuffle-button');
    let progressSlider = document.getElementById('song-progress');
    
    playButton.addEventListener('click', function (event) {
        
        if (playButton.disabled) {
            return;
        }

        if (player == null || player.seek() <= 0 || (player.seek() * 1000) >= queue[0].duration) {
            startNextSong();
        }
        else {
            player.play();
        }
        
        playButton.disabled = true;
        pauseButton.disabled = false;
        skipButton.disabled = false;
        shuffleButton.disabled = false;
        //progressSlider.disabled = true;
        document.getElementById('now-playing').hidden = false;
    });

    
    pauseButton.addEventListener('click', function (event) {
        if (pauseButton.disabled) {
            return;
        }
        player.pause();
        playButton.disabled = false;
        pauseButton.disabled = true;
        skipButton.disabled = true;
        //progressSlider.disabled = false;
    });

    skipButton.addEventListener('click', function (event) {
        if (skipButton.disabled) {
            return;
        }
        player.stop();
        
    });

    shuffleButton.addEventListener('click', function (event) {
        if (shuffleButton.disabled) {
            return;
        }
        shuffleQueue();
        
    });

    progressSlider.addEventListener('change', function (event) {
        if (progressSlider.disabled || player.state() != 'loaded') {
            return;
        }
        player.seek(progressSlider.value / 1000);
    });

}

function isQueueLooping() {
    return document.getElementById('loop-queue').checked;
}

function isSongLooping() {
    return document.getElementById('loop-song').checked;
}

function resetControls() {
    playlist = null;
    document.getElementById('load-playlist-button').disabled = false;

    document.getElementById('player-controls').hidden = true;

    document.getElementById('play-button').disabled = false;
    document.getElementById('pause-button').disabled = true;

    document.getElementById('now-playing').hidden = true;
}

function fetchAudio(video_id) {
    /*
    let formats = ytdl.filterFormats((await ytdl.getInfo(`https://youtube.com/watch?v=${video_id}`)).formats, 'audioonly');
    let ret = [];
    for (let i = 0; i < formats.length; i++) {
        ret.push(formats[i].url);
    }

    return ret;
    */
    let ret = [execSync('youtube-dl --get-url https://youtube.com/watch?v='+video_id).toString().split("\n")[1]];
    console.log(ret);
    return ret;
    
}

function onPlayerStop() {
    console.log("Finished " + queue[0].title)
    if (isSongLooping()) {
        // Do nothing so the same song is in position 0
    }
    else if (isQueueLooping()) {
        queue.push(queue.shift());
    }
    else {
        queue.shift();
    }
    if (queue.length <= 0) {
        resetControls();
    }
    else {
        startNextSong();
    }

    clearInterval(updateSongProgressInterval);
}

function updateSongProgress() {
    window.player = player;
    if (player.playing()) {
        document.getElementById('song-progress').value = player.seek() * 1000;
    }
    
}

function startNextSong() {
    player = new Howl({
        src: fetchAudio(queue[0].id),
        html5: true,
        ext: ['webm'],
        autoplay: true,
        onplay: function () {
            console.log((player.seek() > 0 ? "Resuming " : "Playing ") + queue[0].title);
            document.getElementById('song-thumbnail').src = queue[0].thumbnail;
            document.getElementById('song-title').innerText = queue[0].title;
            document.getElementById('song-progress').max = queue[0].duration;
            updateSongProgressInterval = setInterval(updateSongProgress, 500);
        },
        onplayerror: function() {
            console.log("Could not play song: " + queue[0].title);
            onPlayerStop();
        },
        onend: onPlayerStop,
        onstop: onPlayerStop
    });
    window.queue = queue;
    player.play();
    
}



function loadPlaylist() {

    progressBar = document.getElementById('download-progress-bar');
    progressBar.max = playlist.videos.length;
    document.getElementById('download-progress-div').hidden = false;

    for (let i = 0; i < playlist.videos.length; i++) {
        progressBar.value = i+1;
        queue.push(playlist.videos[i]);
    }
    console.log(queue);
    

    document.getElementById('download-progress-div').hidden = true;

}

window.onPlaylistSubmission = async function () {
    let submission = document.forms["playlistForm"]["playlistURL"].value;
    try {
        // For very large playlists, not all songs may be loaded - in the future, make the frontend tell the user that not all songs were loaded.
        playlist = await YouTube.getPlaylist(submission).then(p => p.fetch());
        console.log(playlist);
        loadPlaylist();
        showControls();
        return true;
    }
    catch (error) {
        // Invalid playlist URL
        console.error(error);
        alert('Invalid playlist URL.');
        return false;
        
    }
};





