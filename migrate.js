const DATABASENAME = "data.sqlite"

const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(DATABASENAME)

const runDB = (sql) => new Promise((resolve, reject)=>{
    db.run(sql,(err)=>{
        if(err){reject()}
        resolve()
    })
})

const get = (sql) => new Promise((resolve, reject)=>{
    db.all(sql, (error, row) => {
        if(error){reject()}
        resolve(row)
    })
})

!async function(){
    //await runDB("alter table node add column isEndNode bool;")

    const toots = await get("select count(*) as count, tootId-100000000000000000 as tootId from node group by tootId;")
    //ケタが多すぎて落ちるので桁併せて扱う
    await runDB("update node set isEndNode=false;")

    console.log(toots)

    for(let toot of toots){
        const tootId = toot.tootId
        const count = toot.count - 1
        const sql = `update node set isEndNode=true where tootId=${tootId}+100000000000000000 and nodeNum=${count}`
        await runDB(sql)
        .catch((e)=>console.error(e))
        console.log(sql)
    }

}()