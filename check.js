import axios from "axios"
import { readWallets, writeLineToFile } from "./utils/common.js"

const capsolverKey = 'CAP-xxx'

async function solveCaptcha() {
    let token = ''
    
    const captchaTaskResponse = await axios.post('https://api.capsolver.com/createTask', {
        clientKey: capsolverKey,
        task: {
            "type": "RecaptchaV3TaskProxyless",
            "websiteURL": "https://genesis.celestia.org/",
            "websiteKey": "6LdGZBonAAAAAE0mBBza18zR9usCiZo8BfHT7h24",
            "pageAction": 'submit'
        }
    }).then(async taskResponse => {
        while (token === '') {
            const captchaResponse = await axios.post('https://api.capsolver.com/getTaskResult', {
                clientKey: capsolverKey,
                taskId: taskResponse.data.taskId
            }).then(async res => {
                if (res.data.status === 'ready') {
                    token = res.data.solution.gRecaptchaResponse
                }
            }).catch(error => {
                console.log(error.toString())
            })
        }
    }).catch(error => {
        console.log(error.toString())
    })

    return token
}

async function checkWallet(wallet) {
    let token = await solveCaptcha()
    
    if (token) {
        await axios.get(`https://genesis-api.celestia.org/api/v1/airdrop/eligibility/${wallet}?recaptcha_token=${token}`)
        .then(tiaRes => {
            console.log(wallet, tiaRes.data.slug)
            writeLineToFile('./eligible.txt', wallet)
        }).catch(e => {
            console.log(wallet, e.response.data.slug)
        })
    }
}

let wallets = readWallets('./wallets.txt')

for (const wallet of wallets) {
    await checkWallet(wallet)
}