const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    log("------------------------")
    const args = ["0x6e60e93f2ef8bae20b4b5be50ed41a188d7e356e887e9035ebcfcd371a61068f"]
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
