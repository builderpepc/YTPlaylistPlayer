const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')

const DEV_MODE = false;

app.once('ready', () => {
    win = new BrowserWindow({
      width: 450,
      height: 800,
      show: false,
      resizable: DEV_MODE,
      webPreferences: {
        contextIsolation: false,
        preload: path.join(__dirname, 'app/preload.js')
      }
    });

    win.loadFile('app/index.html');

    if (!DEV_MODE) {
      win.removeMenu();
    }
    
    win.setTitle("YTPlaylistPlayer");
  
    win.once('ready-to-show', () => {
      win.show();
    });
  });