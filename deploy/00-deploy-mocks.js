const { network, ethers } = require("hardhat")
const { developementNetworks } = require("../helper-hh-config")

const BASE_FEE = ethers.utils.parseEther("0.25")
const GAS_PRICE_LINK = 1e9 // link per gas 1000000000

module.exports = async function ({ deployments, getNamedAccounts }) {
    const { deploy, log } = deployments()
    const { deployer } = getNamedAccounts()


    if (developementNetworks.includes(network.name)) {
        console.log("Local network detected. Deploying mocks...")
        const mock = deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: [BASE_FEE, GAS_PRICE_LINK],
        })
        log("Mocks deployed!")
        log("---------------------------------------")

    }
}

module.exports.tags = ["all", "Mocks"]