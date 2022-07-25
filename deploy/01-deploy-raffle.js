const { getNamedAccounts, deployments, network, ethers } = require("hardhat")
const { developementNetworks, networkConfig } = require("../helper-hh-config")
const { verify } = require("../utils/verify")

const VRF_SUB_AMOUNT = ethers.utils.parseEther("2")


module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let VRFCoordinatorV2, subscriptionId

    if (developementNetworks.includes(network.name)) {
        const VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        VRFCoordinatorV2 = VRFCoordinatorV2Mock.address

        const transactionResponse = await VRFCoordinatorV2Mock.createSubscription() // request subscription
        const transactionReceipt = await transactionResponse.wait(1)
        subscriptionId = transactionReceipt.events[0].args.subId // get subscription ID
        await VRFCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_AMOUNT)
    } else {
        VRFCoordinatorV2 = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    const entranceFee = networkConfig[chainId]["entranceFee"]
    const gasLane = networkConfig[chainId]["gasLane"]
    const callbackgasLimit = networkConfig[chainId]["callbackGasLimit"]
    const interval = networkConfig[chainId]["interval"]

    const args = [VRFCoordinatorV2, entranceFee, gasLane, subscriptionId, callbackgasLimit, interval]

    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    })

    if (!developementNetworks.includes(network.name)) {
        log("Verifying the contract .....")
        await verify(raffle.address, args)
    }
    log("---------------------")

}
module.exports.tags = ["raffle", "all"]