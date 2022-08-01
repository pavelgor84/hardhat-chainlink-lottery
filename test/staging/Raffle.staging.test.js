const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developementNetworks } = require("../../helper-hh-config")
const { networkConfig } = require("../../helper-hh-config")

developementNetworks.includes(network.name) ? describe.skip : describe("Unit tests:", function () {
    let raffle, deployer, entranceFee
    const chainId = network.config.chainId

    beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        raffle = await ethers.getContract("Raffle", deployer)
        entranceFee = await raffle.getEntranceFee()
    })

    desribe("Raffle staging test", function () {
        it("should enter raffle and use vrfCoordinator and keeper for a random number and winner", async () => {
            const accounts = await ethers.getSigners()

            await new Promise(async (resolve, reject) => {
                raffle.once("WinnerPicked", function () {
                    try {
                        console.log("The winner is picked!")
                        const theWinner = await raffle.getRecentWiner()
                        const endPlayerBalance = accounts[0].getBalance()
                        const endTimeStamp = raffle.getLastTimeStamp()
                        //asserts
                        await expect(raffle.getPlayer(0)).to.be.reverted
                        assert.equal(theWinner.toString(), accounts[0].address)
                        assert.equal(endPlayerBalance.toString(), startPlayerBalance.add(entranceFee).toString())
                        assert(startTimeStamp < endTimeStamp)
                        resolve()

                    } catch (e) {
                        console.log(e)
                        reject(e)
                    }
                })
                await raffle.enterRaffle({ value: entranceFee })
                const startPlayerBalance = accounts[0].getBalance()
                const startTimeStamp = raffle.getLastTimeStamp()

            })


        })

    })




})
