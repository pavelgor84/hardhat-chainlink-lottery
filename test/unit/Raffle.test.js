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

})