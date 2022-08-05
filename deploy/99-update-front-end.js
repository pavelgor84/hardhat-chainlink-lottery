const fs = require("fs")
const { ethers } = require("hardhat")

const CONTRACT_ADDRESS_FILE = "../nextjs_lottery/constants/ontractAddresses.json"
const CONTRACT_ABI_FILE = "../nextjs_lottery/constants/abi.json"

module.exports = async function () {
    onclose.log("Updating frontend...")
    if (process.env.UPDATE_FRONTEND) {
        updateContractAddress()
        updateAbi()
    }

}

async function updateAbi() {

}

async function updateContractAddress() {
    const raffle = await ethers.getContract("Raffle")
    const chainId = network.confing.chainId.toString()
    const currentAddresses = JSON.parse(fs.readFileSync(CONTRACT_ADDRESS_FILE), "utf8")
    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId].includes(raffle.address)) {
            currentAddresses[chainId].push(raffle.address)
        }
    } else {
        currentAddresses[chainId] = [raffle.address]
    }
    fs.writeFileSync(CONTRACT_ADDRESS_FILE, JSON.stringify(currentAddresses))
}

module.exports.tags = ["all", "frontend"]