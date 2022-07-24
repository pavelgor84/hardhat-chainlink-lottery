const { network } = require("hardhat")


module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts

    const raffle = deploy("Raffle", {
        from: deployer,
        args: [],
        waitConfirmations: network.config.blockConfirmations || 1
    })

}