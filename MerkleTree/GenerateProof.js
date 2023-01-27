const { StandardMerkleTree } = require("@openzeppelin/merkle-tree")
const fs = require("fs")

// (1)
const tree = StandardMerkleTree.load(JSON.parse(fs.readFileSync("MerkleTree/tree.json")))

// (2)
for (const [i, v] of tree.entries()) {
    if (v[0] === "QmRRPWG96cmgTn2qSzjwr2qvfNEuhunv6FNeMFGa9bx6mQ") {
        // (3)
        const proof = tree.getProof(i)
        console.log("Value:", v)
        console.log("Proof:", proof)
    }
}
