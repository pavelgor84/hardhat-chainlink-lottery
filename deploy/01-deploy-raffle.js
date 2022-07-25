const { network, ethers } = require("hardhat")
const { developementNetworks, networkConfig } = require("../helper-hh-config")


module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts
    const chainId = network.config.chainId
    let VRFCoordinatorV2

    if (developementNetworks.includes(network.name)) {
        const VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        VRFCoordinatorV2 = VRFCoordinatorV2Mock.address // check this <------
    } else {
        VRFCoordinatorV2 = networkConfig.chainId["vrfCoordinatorV2"]
    }

    const raffle = deploy("Raffle", {
        from: deployer,
        args: [],
        waitConfirmations: network.config.blockConfirmations || 1
    })

}