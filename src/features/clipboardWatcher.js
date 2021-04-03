'use strict'

import ItemsDao from "./dao/itemsdao";

const electron = require('electron')
const clipboard = electron.clipboard

const log = require('electron-log');

log.transports.file.level = 'info';
log.transports.file.file = __dirname + 'pasteIt.log';

/*
Tell if there is any difference between 2 images
*/
// function imageHasDiff (a, b) {
//     return !a.isEmpty() && b.toDataURL() !== a.toDataURL()
// }

/*
Tell if there is any difference between 2 strings
*/
function textHasDiff (a, b) {
    return a && b !== a
}

class ClipboardWatcher {
    constructor(db, win) {
        this.win = win
        this.db = db
        this.itemsDao = new ItemsDao(this.db)
    }

    async onTextChange(text) {
        console.log('new text', text)
        const topItem = (await this.itemsDao.getFirstRow()).row
        if (!topItem || topItem.text !== text) {
            await this.itemsDao.create('text', text, null)
            this.win.webContents.send('refreshContents', null)
        }
    }
    async onRtfChange(rtf) {
        console.log('new rtf', rtf)
        if (rtf.indexOf('Riched') === -1) return
        const topItem = (await this.itemsDao.getFirstRow()).row
        if (!topItem || topItem.text !== rtf) {
            await this.itemsDao.create('rtf', rtf, null)
            this.win.webContents.send('refreshContents', null)
        }
    }

    async onImageChange(imageData) {
        console.log('new image', imageData)
        const topItem = (await this.itemsDao.getFirstRow()).row
        if (!topItem || topItem.data !== imageData) {
            await this.itemsDao.create('image', null, imageData)
            this.win.webContents.send('refreshContents', null)
        }
    }

    async start() {
        log.info('clipboardWatcher init')
        const firstRow = await this.itemsDao.getFirstRow()
        log.info('clipboardWatcher 2')
        if (firstRow && firstRow.row) {
            if(firstRow.row.type === 'text') this.lastText = firstRow.row.text
            else if (firstRow.row.type === 'image') this.lastImage = firstRow.row.data
            else if (firstRow.row.type === 'rtf') this.lastRtf = firstRow.row.text
        }
        this.intervalId = setInterval( async() => {
            const text = clipboard.readText()
            const image = clipboard.readImage()
            const rtf = clipboard.readRTF()


            if (!image.isEmpty() && (!this.lastImage || image.toPNG().toString() !== this.lastImage.toString()) ) {
                this.lastImage = image.toPNG()
                return await this.onImageChange(this.lastImage)
            }

            if (textHasDiff(text, this.lastText)) {
                this.lastText = text
                return await this.onTextChange(text)
            }

            if (textHasDiff(rtf, this.lastRtf)) {
                this.lastRtf = rtf
                return await this.onRtfChange(rtf)
            }
        }, 450)
    }

    stop() {
        clearInterval(this.intervalId)
    }
}

export default ClipboardWatcher

