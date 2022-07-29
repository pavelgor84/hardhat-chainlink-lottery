const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developementNetworks } = require("../../helper-hh-config")
const { networkConfig } = require("../../helper-hh-config")

!developementNetworks.includes(network.name) ? describe.skip : describe("Unit tests:", function () {
    let raffle, vrfCoordinatorV2, deployer, entranceFee, interval
    const chainId = network.config.chainId

    beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        vrfCoordinatorV2 = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
        raffle = await ethers.getContract("Raffle", deployer)
        entranceFee = await raffle.getEntranceFee()
        interval = await raffle.getInterval()
    })

    describe("Constructor", function () {
        it("should initialize constructor correctly", async () => {
            const status = await raffle.getState()
            assert.equal(status.toString(), "0")
            assert.equal(interval.toString(), networkConfig[chainId]["interval"])
        })
    })

    describe("enterRaffle", function () {
        it("should revert on low entrance fee", async () => {
            await expect(raffle.enterRaffle()).to.be.revertedWith("Raffle__notEnoughFeeToEnter")
        })
        it("should add player to array of players", async () => {
            const enter = await raffle.enterRaffle({ value: entranceFee })
            const player = await raffle.getPlayer(0)
            assert.equal(player, deployer)
        })
        it("should emit player", async () => {
            await expect(raffle.enterRaffle({ value: entranceFee })).to.emit(raffle, "RaffleEnter")
        })
        it("doesn't allow to enter during calculation process", async () => {
            // suppose the current block has a timestamp of 01:00 PM
            // await network.provider.send("evm_increaseTime", [3600])
            // await network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp

            await raffle.enterRaffle({ value: entranceFee })
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            await raffle.performUpkeep([])
            await expect(raffle.enterRaffle({ value: entranceFee })).to.be.revertedWith("Raffle__NotOpen")

        })
    })

    describe("checkUpKeep", function () {
        it("should be failed without ETH", async () => {
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
            assert(!upkeepNeeded)
        })
        it("should fail to checkUpKeep during CALCULATING", async () => {
            await raffle.enterRaffle({ value: entranceFee })
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            await raffle.performUpkeep([])
            const status = await raffle.getState()
            assert.equal(status.toString(), 1)
            const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
            assert.equal(upkeepNeeded, false)

        })
        it("should return true if enough time passed, has player & ETH and has open state", async () => {
            await raffle.enterRaffle({ value: entranceFee })
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
            assert.equal(upkeepNeeded, true)
        })
    })

    describe("performUpKeep", function () {
        it("should return true when upkeep is true", async () => {
            await raffle.enterRaffle({ value: entranceFee })
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            const tx = await raffle.performUpkeep([])
            assert(tx)
        })
        it("should fail when checkUpKeep isn't ready", async () => {
            await expect(raffle.performUpkeep([])).to.be.revertedWith("Raffle__UpkeepNotNeeded")
        })
        it("should request for random numbers, emit request and change state", async () => {
            await raffle.enterRaffle({ value: entranceFee })
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])
            const txResponse = await raffle.performUpkeep([])
            const txReceipt = await txResponse.wait(1)
            const requestId = txReceipt.events[1].args.requestId
            const raffleState = await raffle.getState()
            assert.equal(raffleState.toString(), "1")
            assert(requestId.toNumber() > 0)
        })
    })

    describe("fulfill random words", function () {
        beforeEach(async () => {
            await raffle.enterRaffle({ value: entranceFee })
            await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
            await network.provider.send("evm_mine", [])

        })

        it("can only be called after performUpKeep", async () => {
            await expect(vrfCoordinatorV2.fulfillRandomWords(0, raffle.address)).to.be.revertedWith("nonexistent request")
            await expect(vrfCoordinatorV2.fulfillRandomWords(1, raffle.address)).to.be.revertedWith("nonexistent request")
        })
        it("picks a winner, reset the lottery vars and send money", async () => {
            const account = await ethers.getSigners()
            const extraPlayers = 3
            for (let i = 1; i <= extraPlayers; i++) { //i = 0 is deployer account, 1-3 are test accounts
                raffle = raffle.connect(account[i])
                await raffle.enterRaffle({ value: entranceFee })
            }
            const currentTimeStamp = await raffle.getLastTimeStamp()


            await new Promise(async (resolve, reject) => {

                raffle.once("WinnerPicked", async () => {
                    try {
                        const winner = await raffle.getRecentWiner()
                        console.log(winner + "<--winner")
                        // console.log(account[0].address)
                        // console.log(account[1].address)
                        // console.log(account[2].address)
                        // console.log(account[3].address)
                        // console.log(account[4].address)
                        const endWinnerBalance = await account[1].getBalance()
                        //console.log(`end winner ballance: ${endWinnerBalance}`)
                        const numPlayers = await raffle.getNumberOfPlayers()
                        const newTimestamp = await raffle.getLastTimeStamp()
                        const state = await raffle.getState()
                        assert.equal(numPlayers.toString(), "0")
                        assert(newTimestamp > currentTimeStamp)
                        assert.equal(state.toString(), "0")
                        assert.equal(endWinnerBalance.toString(), startingWinnerBalance.add(entranceFee.mul(extraPlayers).add(entranceFee)).toString())
                        //console.log('end balance ' + (startingWinnerBalance.add(entranceFee.mul(extraPlayers).add(entranceFee)).toString()))
                        resolve()
                    } catch (e) {
                        reject(e)
                    }
                })

                const tx = await raffle.performUpkeep([])
                const receipt = await tx.wait(1)
                const startingWinnerBalance = await account[1].getBalance()
                console.log(`start winner ballance: ${startingWinnerBalance}`)
                await vrfCoordinatorV2.fulfillRandomWords(receipt.events[1].args.requestId, raffle.address)
                console.log("fulfillRandomnes executed")
            })


        })
    })

})