const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
const url = require('url')

ipcMain.on('playlist-submission', (arg) => {
    console.log(arg);
});

app.once('ready', () => {
    win = new BrowserWindow({
      width: 450,
      height: 800,
      show: false,
      resizable: false,
      webPreferences: {
        contextIsolation: false,
        preload: path.join(__dirname, 'app/preload.js')
      }
    });

    win.loadFile('app/index.html');

    win.removeMenu();
    win.setTitle("YTPlaylistPlayer");
  
    win.once('ready-to-show', () => {
      win.show();
    });
  });