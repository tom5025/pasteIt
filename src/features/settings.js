import {Key, windef} from "windows-registry";
import fs from "fs"

const electron = require('electron')


let _settings = { maxHistory : 100}

export default class Settings {
    get settings() { return _settings }
    set settings(value) { _settings = value }
    read() {
        // const userDir = electron.app.getPath('userData') + '\\PasteIt.JSON'
        // if (fs.existsSync(userDir)) this.settings = JSON.parse(fs.readFileSync(`${userDir}`, { encoding: "utf-8"}))
    }

    write() {
        // const userDir = electron.app.getPath('userData') + '\\PasteIt.JSON'
        // fs.writeFileSync(`${userDir}`, JSON.stringify(this.settings));
    }
}
