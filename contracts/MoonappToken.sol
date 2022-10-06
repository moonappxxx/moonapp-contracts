// SPDX-License-Identifier: GPL-2.0-or-later

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "./Governed.sol";

/**
 * @title MoonappToken contract
 * @dev This is the implementation of the ERC20 Moonapp Token.
 *
 * The token is initially owned by the deployer address that can mint tokens to create the initial
 * distribution.
 *
 */

contract MoonappToken is ERC20, ERC20Burnable, Governed {
    using SafeMath for uint256;
    uint256 public totalSupplyLimit;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 _initialSupply,
        uint256 _totalSupplyLimit
    ) ERC20(name_, symbol_) {
        Governed._initialize(msg.sender);
        totalSupplyLimit = _totalSupplyLimit * (10**18);
        _mint(msg.sender, _initialSupply * (10**18));
    }

    function burnFrom(address _account, uint256 _amount)
        public
        override
        onlyGovernor
    {
        _burn(_account, _amount);
    }

    function mint(address _account, uint256 _amount) external onlyGovernor {
        uint256 _totalSupply = totalSupply();
        require(
            _totalSupply.add(_amount) <= totalSupplyLimit,
            "We are reached the limit in the total supply"
        );

        _mint(_account, _amount);
    }
}
