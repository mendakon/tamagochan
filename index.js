"use strict"

const DATABASENAME = "data.sqlite"
const inPutFileName = "./authedId.json" //読み込みファイルの名前
const baseUrl = 'https://mstdn.tamag.org'


const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(DATABASENAME)
const Mastodon = require("mastodon-api")
const fs = require("fs").promises
const MeCab = new require('mecab-async')
const mecab = new MeCab()
const cron = require('node-cron')

let M

//main
const main = async()=>{
    //アクセストークンの読み込み
    const input = await fs.readFile(inPutFileName, "utf-8")
    .catch((err)=>console.error(err))

    const id_data = JSON.parse(input)

    
    const info = {
        access_token:id_data.accessToken,
        timeout_ms: 60 * 1000,
        api_url: `${baseUrl}/api/v1/`,
    }
    M = new Mastodon(info)
    
    
    //購読を開始
    const listener = M.stream('streaming/public/local')
    listener.on('message', handleToot)
    listener.on('error', err => console.error(err))

    cron.schedule('*/30 * * * *', toot)
    
}

const handleToot = async(msg)=>{
    if(!msg.data.content){return}
    //成型（難しい！！）
    const content = await msg.data.content
            .replace(/(<("[^"]*"|'[^']*'|[^'">])*>)/g,"")
            .replace(/(http|https):\/\/([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?/g,"")

    
    const words = await mecabWakachi(content)
    .catch((err)=>console.error(err))

    console.log(words)
    let tmpWord = ""
    for(let nodeNum=0; nodeNum<words.length; nodeNum++){
        const isEndNode = nodeNum>=words.length
        await insertWord("insert into node values(?, ?, ?, ?, ?)"
            ,[nodeNum, tmpWord, words[nodeNum], msg.data.id, isEndNode], )
            .catch((err)=>console.error(err))
        tmpWord = words[nodeNum]
    }
}

const toot = async function(){

    let result
    do{
	result = await createToot()
    }while(!result) 

    console.log(result)

    
    M.post('statuses', {status:result}, function (err, data, res) {
        if (!err)
        console.log(res)
    })
    
    

}

const createToot = async function(){

    const head = await getWord('select * from node where nodeNum=0 order by random() limit 1')
    .catch(err=>console.error(err))
    if(!head){return "エラー：トゥートぅーがないよ！"}

    let result = ""
    let content = " "
    let word = head.word2
    let nodeNum = 0


    while(true){
        const sql = `select * from node where nodeNum>=${nodeNum} and word1="${word}" order by random() limit 1;`
        content = await getWord(sql)
        .catch(err=>console.error(err))
        if(!content){return "エラー：文章の生成に失敗したよ"}

        //次回はwordでサーチする
        word = content.word2
        //word1を追加する
        result += content.word1
        //次は自身より大きいnodeNumで検索する
        nodeNum = content.nodeNum
        //終端のnodeであればword2を追加して終了
        if(content.isEndNode){
            result += content.word2
            break
        }
    }

    return result
}



//windowsはこれないとうごかないっぽい
//コマンドが通るようにしている
if(process.platform === 'win32'){
    mecab._shellCommand = function(str){
        return  'echo '+ str + ' |' + this.command
    }
}
//wakachiPromise化
const mecabWakachi = (str) => new Promise((resolve,reject)=>{
    mecab.wakachi(str,(err,result)=>{
        if(err){reject(err)}
        resolve(result)
    })
})

//DBをやることやる
const insertWord = (sql,arg) => new Promise((resolve, reject)=>{
    db.run(sql,arg,(err)=>{
        if(err){reject()}
        resolve()
    })
})
const getWord = (sql) => new Promise((resolve, reject)=>{
    db.get(sql, (error, row) => {
        if(error){reject()}
        resolve(row)
    })
})


main()
