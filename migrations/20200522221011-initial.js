'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  // db.runSql(`CREATE TABLE IF NOT EXISTS categories (
  //           categorieId INT NOT NULL AUTO_INCREMENT,
  //           name VARCHAR(255),
  //           color VARCHAR(10),
  //           index INTEGER
  //       )`)
  db.runSql(`CREATE TABLE items (            
            idx REAL DEFAULT NULL,
            type VARCHAR(255) NOT NULL,
            text TEXT DEFAULT NULL,
            data BLOB DEFAULT NULL
             )`)
  return null;
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
