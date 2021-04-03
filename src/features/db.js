const sqlite3 = require('sqlite3').verbose();
const homedir = require('os').homedir();
const path = require('path')
const log = require('electron-log');

log.transports.file.level = 'info';
log.transports.file.file = __dirname + 'pasteIt.log';

export default class DbManager {

    createDb() {
        const isBuild = process.env.NODE_ENV === 'production'

        // const pathToDbFile = path.join(
        //     (isBuild ? __dirname : __static),
        //     (isBuild ? '../../' : ''),
        //     'pasteIt.db'
        // )

        log.info('avant init db');
        log.info('dirname is '+__dirname)
        log.info('homedir is ' + homedir)
        this.db = new sqlite3.Database(path.join(homedir, 'pasteIt.db'));
        log.info('après init db');
    }

    clearDb() {
        this.db.close()
    }
}


