const { StandardMerkleTree } = require("@openzeppelin/merkle-tree")
const fs = require("fs")

// (1)
const values = [
    ["QmRRPWG96cmgTn2qSzjwr2qvfNEuhunv6FNeMFGa9bx6mQ", "0", "ef952d"],
    ["QmPbxeGcXhYQQNgsC6a36dDyYUcHgMLnGKnF8pVFmGsvqi", "1", "ef952d"],
]

// (2)
const tree = StandardMerkleTree.of(values, ["string", "uint256", "string"])

// (3)
console.log("Merkle Root:", tree.root)

// (4)
fs.writeFileSync("MerkleTree/tree.json", JSON.stringify(tree.dump()))
