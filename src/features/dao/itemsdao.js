import {encrypt} from "../security";
import Settings from "../settings";

const MINIMUM_DISTANCE = 0.5

export default class ItemsDao {
    constructor(db) {
        this.db = db
    }

    async getFirstRow() {
        let that = this
        return new Promise(function(resolve, reject) {
            that.db.get(`SELECT rowid, type, idx, text, data FROM items ORDER BY idx ASC`, [], (err, row) => {
                if (err) reject(err)
                else resolve({row: row})
            })
        })
    }

    async getLastRow() {
        let that = this
        return new Promise(function(resolve, reject) {
            that.db.get(`SELECT rowid, type, idx, text, data FROM items ORDER BY idx DESC`, [], (err, row) => {
                if (err) reject(err)
                else resolve({row: row})
            })
        })
    }

    async getByText(searchText) {
        let that = this
        return new Promise(function(resolve, reject) {
            that.db.all(`SELECT rowid, type, idx, text, data  FROM items WHERE type = 'text' AND text like ?`, [`%${searchText}%`], (err, rows) => {
                if (err) reject(err)
                else resolve({rows: rows})
            })
        })
    }

    async getByIndex(index) {
        let that = this
        return new Promise(function(resolve, reject) {
            that.db.all(`SELECT rowid, type, idx, text, data FROM items WHERE idx = ?`, [index], (err, row) => {
                if (err) reject(err)
                else resolve({row: row})
            })
        })
    }

    async getList() {
        let that = this
        return new Promise(function(resolve, reject) {
            that.db.all(`SELECT rowid,type, idx,text,data FROM items ORDER BY idx ASC LIMIT 1000`, [], (err, rows) => {
                if (err) {
                    reject(err)
                } else resolve({rows: rows})
            })
        })
    }

    async getCount() {

        try {
            let that = this
            return new Promise(function(resolve, reject) {
                that.db.get(`SELECT COUNT(*) FROM items`, [], (err, row) => {
                    if (err) reject(err)
                    else resolve({row: row})
                })
            })
        } catch (e) {
            console.log('gneeee', e)
        }

    }

    async create(type, text, data) {
        const textEncrypt = text
        const dataEncrypt = data

        let index = 65536

        const that = this
        const settings = new Settings()
        settings.read()
        console.log('heuuu ouais test2', {undefined})
        const countRow = await this.getCount()
        if (countRow.row.count > settings.settings.maxHistory) {
            const lastRow = await this.getLastRow()
            this.db.run(`DELETE FROM items WHERE rowid = ?`, [lastRow.rowid])
        }

        const existing = await new Promise((resolve,reject) => {
            that.db.all(`SELECT rowid, idx FROM items WHERE idx >= 0 ORDER BY idx LIMIT 2`, [], (err, rows) => {
                if (err) reject(err)
                else resolve(rows)
            })
        })

        let nextToMove = null
        if (existing.length > 0) {
            const shouldMoveNextItem = existing[0].idx - (existing[0].idx / 2) < MINIMUM_DISTANCE ||
                existing[0].idx < MINIMUM_DISTANCE
            if (shouldMoveNextItem) {
                console.log("[ItemsDao:create] move next item to make room is necessary")
                nextToMove = { rowid: existing[0].rowid, nextIndex: null }
                if (existing.length > 1) {
                    nextToMove.nextIndex = existing[0].idx + (existing[1].idx - existing[0].idx) / 2
                } else {
                    nextToMove.nextIndex = 65536 * 2
                }
                index = existing[0].idx + 128
            } else {
                index = existing[0].idx / 2
            }
        }

        let insertId = null
        const dbOther = this
        await new Promise(function(resolve, reject) {
            dbOther.db.run(`INSERT INTO items(type, text, data, idx) VALUES (?,?,?,?)`,
                [type, textEncrypt, dataEncrypt, index], function (err) {
                    if (err) {
                        console.log('[ItemsDao:create] could not insert item ', err.message)
                        reject(err)
                    } else {
                        insertId = this.lastID
                        resolve(this.lastID)
                    }
                })
            })



        // recursive move if necessary
        if (nextToMove) {
            console.log("[ItemsDao:create] recursive call to move next items")
            let omittedItems = [insertId]
            await this.updateIndex(nextToMove.rowid, nextToMove.nextIndex,nextToMove.nextIndex + 256, omittedItems)
        }
        return { insertId: insertId }
    }

    async updateIndex(rowid, oldIndex, index, omittedItems) {
        const queryToExec = omittedItems.length === 0 ?
                `SELECT rowid, idx FROM items WHERE idx >= ? AND rowid <> ? ORDER BY idx LIMIT 1` :
                `SELECT rowid, idx FROM items WHERE idx >= ? AND rowid <> ? AND NOT rowid in (${omittedItems.slice(0).map( () => '?').join(',')}) ORDER BY idx LIMIT 1`
        const that = this
        const res = await new Promise((resolve, reject) => {
            const params = omittedItems.length > 0 ? [oldIndex, rowid, ...omittedItems] : [oldIndex, rowid]
            that.db.all(queryToExec, params, (err, rows) => {
                if (err) reject(err)
                else resolve(rows)
            })
        })

        let nextItemToMove = res.length > 0 && res[0].idx - index < MINIMUM_DISTANCE ? res[0] : null
        if (omittedItems.length === 0) {
            let previousIndex = 0
            const previousItem = await new Promise((resolve, reject) => {
                that.db.all(`SELECT rowid, idx FROM items WHERE idx <= ? AND rowId <> ? ORDER BY idx DESC LIMIT 1`,
                    [index, rowid], (err, rows) => {
                    if (err) reject(err)
                    else resolve(rows)
                })
            })
            if (previousItem && previousItem.length > 0) {
                previousIndex = previousItem[0].idx
            }
            if (index - oldIndex < MINIMUM_DISTANCE) {
                index = previousIndex + 128
                nextItemToMove = res.length > 0 ? res[0] : null
            }
        }

        this.db.run(`UPDATE items SET idx = ? WHERE rowid = ?`, [index, rowid])

        if (nextItemToMove) {
            omittedItems.push(rowid)
            await this.updateIndex(nextItemToMove.rowid, nextItemToMove.idx, nextItemToMove.idx + 256, omittedItems)
        }
    }

    /**
     *
     * @param {number} rowId
     * @returns {Promise<unknown>}
     */
    async get(rowId) {
        let that = this
        return new Promise(function(resolve, reject) {
            that.db.get(`SELECT rowid, type, idx, text, data FROM items WHERE rowid = ?`, [rowId], (err, row) => {
                if (err) reject(err)
                else resolve({row: row})
            })
        })
    }

    async bringToTop(rowId) {
        const firstElem = (await this.getFirstRow()).row
        if (!firstElem) return
        await this.updateIndex(rowId, firstElem.idx, firstElem.idx / 2, [])
        // return this.db.run(`UPDATE items SET idx = ? WHERE rowId = ?`, [firstElem.idx / 2, rowId])
    }

    async delete(rowId) {
        return this.db.run('DELETE FROM items WHERE rowid = ?', [rowId])
    }

    async deleteAll() {
        return this.db.run('DELETE FROM items')
    }


}
