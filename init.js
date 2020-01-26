"use strict"

const sqlite = require('sqlite3').verbose()                                          
var db = new sqlite.Database('data.sqlite')

const serialize = () => new Promise((resolve)=>{
    db.serialize(resolve)
})

!(async ()=>{
    await serialize()
    db.run('CREATE TABLE IF NOT EXISTS node(isHeadNode boolean, word1 text, word2 text, tootId int, unique(word1, word2, tootId))');
    db.close();
})()

