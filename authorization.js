"use strict"

const Mastodon = require("mastodon-api")
const readline = require("readline")
const fs = require("fs").promises

//書き出しファイルの名前
const outPutFileName = "authedId.json"

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

//readlineをpromise化
const question = (query) => new Promise((resolve,reject)=>{
    rl.question(query,(text)=>{
        resolve(text);
    })
})

const baseUrl = 'https://mstdn.tamag.org'

!(async()=>{
    //認証idを取得
    const res = await Mastodon.createOAuthApp(baseUrl + '/api/v1/apps', 'おうち', 'read write follow')
                                .catch((err)=>console.err(err))

    //認証URLを取得して認証コードをユーザー入力してもらう
    const url = await Mastodon.getAuthorizationUrl(res.client_id, res.client_secret, baseUrl,'read write follow')
    console.log('This is the authorization URL. Open it in your browser and authorize with your account!')
    console.log(url)

    const code = await question("認証コード:")
    rl.close()
    
    //アクセストークンを取得
    const access_token  = await Mastodon.getAccessToken(res.client_id, res.client_secret, code, baseUrl)
        .catch((err)=>console.log(err))
    
    const id_data = {
        clientId : res.client_id,
        clientSecret : res.client_secret,
        accessToken: access_token
    }

    //書き込み
    await fs.writeFile(outPutFileName,JSON.stringify(id_data,null,"  "))
        .catch((err)=>console.log(err))

    console.log(id_data)
})()
