const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    log("------------------------")
    const args = ["0x8aaf3a805aa40ccf39783bc26751d51ebd8b8145706d0f069eb793bea568e5a1"]
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
