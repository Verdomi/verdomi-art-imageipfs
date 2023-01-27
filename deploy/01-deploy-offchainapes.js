const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    log("------------------------")
    const args = ["0x55162907986ae1a49e43b5d7503125116faa61f9e65a7a91880ca47bde3b9368"]
    const generals = await deploy("OffChainApes", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(generals.address, args)
    }
    log("------------------------")
}

module.exports.tags = ["all", "offchainapes", "main"]
