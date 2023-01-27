// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Verifier.sol";
import "./Base64.sol";

pragma solidity ^0.8.17;

error OffChainApes__TransferFailed();

contract OffChainApes is ERC721, ERC2981, Verifier {
    using Strings for uint256;

    address internal constant VERDOMI_ADDRESS = 0x62278f1af3b3d2FF91967F1d65E8E2d804dC23d7;
    address internal constant DANKMFER_ADDRESS = 0x1b89Cd273791CB463f75C4973f60d5D68e75f0c5;

    constructor(bytes32 _root) ERC721("Off-Chain Apes", "OCA") Verifier(_root) {
        _setDefaultRoyalty(address(this), 1000);
    }

    mapping(address => uint256) internal amountMinted;
    mapping(uint256 => string) internal idToIpfs;
    mapping(uint256 => string) internal idToColor;

    function mint(
        bytes32[] memory proof,
        string memory imageIpfs,
        uint256 tokenId,
        string memory color
    ) external {
        // Make sure the tokenID + imageIpfs + color are valid
        verify(proof, imageIpfs, tokenId, color);
        // Make sure the minter has not minted 10 tokens already
        require(amountMinted[msg.sender] < 10, "User has already minted the maximum amount");
        // Make sure the minter is not a contract
        require(msg.sender == tx.origin, "No contracts allowed");

        // Increase amount minted by sender
        amountMinted[msg.sender] += 1;
        // Update the IPFS string for the minted tokenId
        idToIpfs[tokenId] = imageIpfs;
        // Update the Color string for the minted tokenId
        idToColor[tokenId] = color;
        // Mint the token
        _mint(msg.sender, tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireMinted(tokenId);
        string[6] memory parts;
        parts[
            0
        ] = '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350"><style>.base { fill: black; font-family: serif; font-size: 12px; }</style><rect width="100%" height="100%" fill="#';

        parts[1] = idToColor[tokenId];

        parts[2] = '" /><text x="3" y="175" class="base">';

        parts[3] = "ipfs://";

        parts[4] = idToIpfs[tokenId];

        parts[5] = "</text></svg>";

        string memory output = string(
            abi.encodePacked(parts[0], parts[1], parts[2], parts[3], parts[4], parts[5])
        );

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Off-Chain Ape #',
                        tokenId.toString(),
                        '", "description": "This NFT is part of a collection of 10,000 created by Verdomi. The collection serves as an artistic expression on the lack of on-chain storage for most NFT artwork. The inspiration for the project came from a tweet by dankmfer.eth. There is a 10% royalty on the collection, with half going to Verdomi and the other half going to dankmfer.", "image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(output)),
                        '"}'
                    )
                )
            )
        );
        output = string(abi.encodePacked("data:application/json;base64,", json));

        return output;
    }

    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }

    function toString(uint256 value) internal pure returns (string memory) {
        // Inspired by OraclizeAPI's implementation - MIT license
        // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function withdrawERC20(address tokenAddress) external {
        IERC20 token = IERC20(tokenAddress);

        uint256 amount = token.balanceOf(address(this)) / 2;

        token.transferFrom(address(this), VERDOMI_ADDRESS, amount);
        token.transferFrom(address(this), DANKMFER_ADDRESS, amount);
    }

    receive() external payable {
        uint256 amount = address(this).balance / 2;

        (bool success1, ) = payable(VERDOMI_ADDRESS).call{value: amount}("");
        if (!success1) {
            revert OffChainApes__TransferFailed();
        }

        (bool success2, ) = payable(DANKMFER_ADDRESS).call{value: amount}("");
        if (!success2) {
            revert OffChainApes__TransferFailed();
        }
    }
}
