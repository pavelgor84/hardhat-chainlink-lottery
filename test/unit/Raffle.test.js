const { assert } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developementNetworks } = require("../../helper-hh-config")
const { networkConfig } = require("../../helper-hh-config")

!developementNetworks.includes(network.name) ? describe.skip : describe("Unit tests:", function () {
    let raffle, vrfCoordinatorV2
    const chainId = network.config.chainId

    beforeEach(async () => {
        const { deployer } = await getNamedAccounts()
        await deployments.fixture(["all"])

        vrfCoordinatorV2 = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
        raffle = await ethers.getContract("Raffle", deployer)

    })

    describe("Constructor", function () {
        it("should initialize constructor correctly", async () => {
            const status = await raffle.getState()
            const interval = await raffle.getInterval()
            assert.equal(status.toString(), "0")
            assert.equal(interval.toString(), networkConfig[chainId]["interval"])
        })
    })

})