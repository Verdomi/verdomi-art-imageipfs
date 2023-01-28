const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree")
const fs = require("fs")
const { off } = require("process")
const { get } = require("http")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Off-Chain Apes Unit Tests", function () {
          let offchain, deployer

          const tree = StandardMerkleTree.load(JSON.parse(fs.readFileSync("MerkleTree/tree.json")))

          const mintData = [
              ["QmRRPWG96cmgTn2qSzjwr2qvfNEuhunv6FNeMFGa9bx6mQ", "0", "ef972c"],
              ["QmPbxeGcXhYQQNgsC6a36dDyYUcHgMLnGKnF8pVFmGsvqi", "1", "ef972c"],
              ["QmcJYkCKK7QPmYWjp4FD2e3Lv5WCGFuHNUByvGKBaytif4", "2", "17e7b6"],
              ["QmYxT4LnK8sqLupjbS6eRvu1si7Ly2wFQAqFebxhWntcf6", "3", "6f5e70"],
              ["QmSg9bPzW9anFYc3wWU5KnvymwkxQTpmqcRSfYj7UmiBa7", "4", "a2e5f5"],
              ["QmNwbd7ctEhGpVkP8nZvBBQfiNeFKRdxftJAxxEdkUKLcQ", "5", "727234"],
              ["QmWBgfBhyVmHNhBfEQ7p1P4Mpn7pm5b8KgSab2caELnTuV", "6", "e4e4a8"],
              ["QmRsJLrg27GQ1ZWyrXZFuJFdU5bapfzsyBfm3CAX1V1bw6", "7", "cccdcf"],
              ["QmXEqPbvM4aq1SQSXN8DSuEcSo5SseYW1izYQbsGB8yn9x", "8", "17e7b6"],
              ["QmUQgKka8EW7exiUHnMwZ4UoXA11wV7NFjHAogVAbasSYy", "9", "6f5e70"],
              ["QmPQdVU1riwzijhCs1Lk6CHmDo4LpmwPPLuDauY3i8gSzL", "10", "17e7b6"],
              ["QmVvdAbabZ2awja88uUhYHFuq67iEiroFuwLGM6HyiWcc8", "11", "cccdcf"],
          ]

          for (let index = 0; index < mintData.length; index++) {
              const item = mintData[index]
              const tokenId = item[1]

              for (const [i, v] of tree.entries()) {
                  if (v[1] === tokenId) {
                      const proof = tree.getProof(i)
                      mintData[index].push(proof)
                  }
              }
          }

          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              player = accounts[1]
              await deployments.fixture(["all"])
              offchain = await ethers.getContract("OffChainApes")
              erc20 = await ethers.getContract("OurToken")
              await offchain.toggleMint()
          })

          describe("Construtor", () => {
              it("Initilizes the NFT Correctly.", async () => {
                  const name = await offchain.name()
                  const symbol = await offchain.symbol()
                  assert.equal(name, "OffChainApes")
                  assert.equal(symbol, "OFFCA")
              })
              it("Initializes the royalty information correctly.", async () => {
                  const royaltyInfo = await offchain.royaltyInfo(0, ethers.utils.parseEther("1"))
                  const receiver = royaltyInfo[0]
                  const amount = royaltyInfo[1].toString()
                  assert.equal(receiver, deployer.address)
                  assert.equal(amount, ethers.utils.parseEther("0.1"))
              })
              it("Sets root correctly.", async () => {
                  const root = await offchain.getRoot()
                  assert.equal(
                      root,
                      "0x6e60e93f2ef8bae20b4b5be50ed41a188d7e356e887e9035ebcfcd371a61068f"
                  )
              })
          })

          describe("mint", () => {
              it("Reverts if not valid proof, imageIpfs, tokenId, or color", async () => {
                  const imageIpfs = mintData[0][0]
                  const tokenId = mintData[0][1]
                  const color = mintData[0][2]
                  const proof = mintData[0][3]

                  await expect(offchain.mint([], imageIpfs, tokenId, color)).to.be.reverted
                  await expect(offchain.mint(proof, "haghaiugh", tokenId, color)).to.be.reverted
                  await expect(offchain.mint(proof, imageIpfs, "9051", color)).to.be.reverted
                  await expect(offchain.mint(proof, imageIpfs, tokenId, "ffffff")).to.be.reverted
              })
              it("Reverts if user minted 10 already", async () => {
                  for (let i = 0; i < 10; i++) {
                      const imageIpfs = mintData[i][0]
                      const tokenId = mintData[i][1]
                      const color = mintData[i][2]
                      const proof = mintData[i][3]
                      await offchain.mint(proof, imageIpfs, tokenId, color)
                  }

                  const imageIpfs = mintData[10][0]
                  const tokenId = mintData[10][1]
                  const color = mintData[10][2]
                  const proof = mintData[10][3]

                  await expect(offchain.mint(proof, imageIpfs, tokenId, color)).to.be.reverted
              })
              it("Increases amount minted by user by one", async () => {
                  const before = await offchain.getAmountMinted(deployer.address)
                  const imageIpfs = mintData[0][0]
                  const tokenId = mintData[0][1]
                  const color = mintData[0][2]
                  const proof = mintData[0][3]
                  await offchain.mint(proof, imageIpfs, tokenId, color)
                  const after = await offchain.getAmountMinted(deployer.address)
                  assert.equal(before.add(1).toString(), after.toString())
              })
              it("Updates imageIpfs for the token", async () => {
                  const imageIpfs = mintData[0][0]
                  const tokenId = mintData[0][1]
                  const color = mintData[0][2]
                  const proof = mintData[0][3]

                  const before = await offchain.getImageIpfs(tokenId)
                  await offchain.mint(proof, imageIpfs, tokenId, color)
                  const after = await await offchain.getImageIpfs(tokenId)

                  assert.equal(before, 0)
                  assert.equal(after, imageIpfs)
              })
              it("Updates Color for the token", async () => {
                  const imageIpfs = mintData[0][0]
                  const tokenId = mintData[0][1]
                  const color = mintData[0][2]
                  const proof = mintData[0][3]

                  const before = await offchain.getBackgroundColor(tokenId)
                  await offchain.mint(proof, imageIpfs, tokenId, color)
                  const after = await await offchain.getBackgroundColor(tokenId)

                  assert.equal(before, 0)
                  assert.equal(after, color)
              })
              it("Successfully mints the token to the sender", async () => {
                  const imageIpfs = mintData[0][0]
                  const tokenId = mintData[0][1]
                  const color = mintData[0][2]
                  const proof = mintData[0][3]

                  const before = await offchain.balanceOf(deployer.address)
                  await offchain.mint(proof, imageIpfs, tokenId, color)
                  const after = await offchain.balanceOf(deployer.address)

                  assert.equal(before, 0)
                  assert.equal(after, 1)
              })
              it("Reverts if mint not open", async () => {
                  await offchain.toggleMint()
                  const imageIpfs = mintData[0][0]
                  const tokenId = mintData[0][1]
                  const color = mintData[0][2]
                  const proof = mintData[0][3]

                  await expect(offchain.mint(proof, imageIpfs, tokenId, color)).to.be.revertedWith(
                      "Mint is not open"
                  )
              })
              it("Increaes totalSupply", async () => {
                  const imageIpfs = mintData[0][0]
                  const tokenId = mintData[0][1]
                  const color = mintData[0][2]
                  const proof = mintData[0][3]

                  const before = await offchain.totalSupply()
                  await offchain.mint(proof, imageIpfs, tokenId, color)
                  const after = await offchain.totalSupply()
                  assert.equal(before, 0)
                  assert.equal(after, 1)
              })
          })

          describe("toggleMint", () => {
              it("Toggles the mint correctly", async () => {
                  const imageIpfs = mintData[0][0]
                  const tokenId = mintData[0][1]
                  const color = mintData[0][2]
                  const proof = mintData[0][3]
                  await offchain.mint(proof, imageIpfs, tokenId, color)

                  await offchain.toggleMint()
                  await expect(
                      offchain.mint(mintData[1][3], mintData[1][0], mintData[1][1], mintData[1][2])
                  ).to.be.revertedWith("Mint is not open")

                  await offchain.toggleMint()
                  await offchain.mint(
                      mintData[2][3],
                      mintData[2][0],
                      mintData[2][1],
                      mintData[2][2]
                  )
              })
              it("Reverts if not owner", async () => {
                  const playerOff = offchain.connect(player)
                  await expect(playerOff.toggleMint).to.be.reverted
              })
          })
      })

/*




*/
