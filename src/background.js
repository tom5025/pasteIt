'use strict'

import { app,
  protocol,
  BrowserWindow,
  globalShortcut,
  screen,
  ipcMain,
  Tray,
  Menu,
  remote} from 'electron'
import {
  createProtocol,
  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'
import ClipboardWatcher from "./features/clipboardWatcher";
import FocusHook from "./features/platform/windows/focusHook";
import DbManager from "./features/db";
import ItemsDao from "./features/dao/itemsdao";
import Settings from "./features/settings";
const isDevelopment = process.env.NODE_ENV !== 'production'
const log = require('electron-log');
const homedir = require('os').homedir();
const path = require('path');
const { createWorker } = require('tesseract.js');

log.transports.file.level = 'info';
log.transports.file.file = __dirname + 'pasteIt.log';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let focusHook = new FocusHook()

// Scheme must be registered before the app is ready
//protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);

let tray
function setupTrayIcon() {
  console.log("dirname", __dirname)
  tray = new Tray(__dirname+'\\pasteit.ico')
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show/Hide', type: 'normal', click: () => { toggleDisplay() }},
    { label: 'Sep1', type: 'separator' },
    { label: 'Quit', type: 'normal', click: () => { app.exit(0) } },
  ])
  tray.setToolTip('PasteIt - tool for managing, browsing, searching in your clipboard contents')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    toggleDisplay()
  })
}

function createWindow () {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  // Create the browser window.
  win = new BrowserWindow({ transparent: true,
    //alwaysOnTop : true,
    frame: false,
    width: width / 4,
    height: height,
    x: 0,
    y: 0,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      allowRunningInsecureContent: true,
      webSecurity: false
  } })


  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    win.webContents.openDevTools()
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }

  win.on('minimize',function(event){
    event.preventDefault();
    win.hide();
  });

  win.on('close', (event) => {

      event.preventDefault();
      win.hide();


    return false;
  })

  win.on('show', () => {
    console.log('sending refresh msg')
    win.webContents.send('refreshContents', 'null')
  })
}

ipcMain.on('paste-something', async(event, arg) => {
  console.log("paste-something event ", event, arg)
  const itemsDao = await new ItemsDao(dbManager.db)
  await itemsDao.bringToTop(arg.rowid)
  focusHook.pasteSomething(arg)
  win.hide()
})

ipcMain.on('settings-set-maxNumberOfItemsValue', (event, arg) => {
  const settings = new Settings()
  settings.read()
  settings.settings.maxHistory = arg
  settings.write()
})




// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  // if (process.platform !== 'darwin') {
  //   app.quit()
  // }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  console.log("activated")
  if (win === null) {
    createWindow();
  }
})

function toggleDisplay() {
  console.log('win isVisible', win.isVisible())
  if (win.isVisible()) {win.hide() }
  else {
    win.show();
  }
}

function registerLaunchShortcut() {
  const ret = globalShortcut.register('CommandOrControl+Alt+C', () => {
    console.log('CommandOrControl+Alt+C is pressed')
    toggleDisplay()
  })

  if (!ret) {
    console.log('enregistrement échoué')
  }

  // Check si le raccourci est enregistré.
  console.log('launching shortcut is registered : ',globalShortcut.isRegistered('CommandOrControl+Alt+C'))
}

let clipboardWatcher = null
let dbManager = null

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installVueDevtools()
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }

  }
  dbManager = new DbManager()
  log.info('1')
  dbManager.createDb()
  log.info('2')
  createWindow()
  log.info('3')
  // setupTrayIcon()
  clipboardWatcher = new ClipboardWatcher(dbManager.db, win)
  log.info('4')
  await clipboardWatcher.start()
  log.info('5')
  registerLaunchShortcut()
  log.info('6')
  setInterval(() => {
    focusHook.saveFocusedControl(win.getNativeWindowHandle())
  }, 500)

})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
