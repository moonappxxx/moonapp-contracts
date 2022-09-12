// SPDX-License-Identifier: GPL-2.0-or-later

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title MoonappToken contract
 * @dev This is the implementation of the ERC20 Moonapp Token.
 *
 * The token is initially owned by the deployer address that can mint tokens to create the initial
 * distribution.
 *
 */

contract MoonappToken is ERC20, ERC20Burnable {
    using SafeMath for uint256;
    address public admin;
    uint256 public totalSupplyLimit;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        uint256 _totalSupplyLimit
    ) ERC20(_name, _symbol) {
        admin = msg.sender;
        totalSupplyLimit = _totalSupplyLimit;
        _mint(msg.sender, _initialSupply);
    }

    function changeAdmin(address newAdmin) external {
        require(msg.sender == admin, "only admin");
        admin = newAdmin;
    }

    function burnFrom(address account, uint256 amount) public override {
        require(msg.sender == admin, "only admin");
        _burn(account, amount);
    }

    function mint(address account, uint256 amount) public {
        require(msg.sender == admin, "only admin");

        uint256 totalSupply = totalSupply();
        require(
            totalSupply.add(amount) <= totalSupplyLimit,
            "We are reached the limit in the total supply"
        );

        _mint(account, amount);
    }
}
