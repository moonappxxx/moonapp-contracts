// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./MoonappToken.sol";

/**
 * @title TokenVesting
 * @dev A token holder contract that can release its token balance gradually like a
 * typical vesting scheme, with a cliff and vesting period.
 */
contract TokenVesting is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for MoonappToken;

    event Released(uint256 amount);

    // beneficiary of tokens after they are released
    address public beneficiary;

    uint256 public cliff;
    uint256 public start;
    uint256 public duration;

    mapping(address => uint256) public released;

    /**
     * @dev Creates a vesting contract that vests its balance of any ERC20 token to the
     * _beneficiary, gradually in a linear fashion until _start + _duration. By then all
     * of the balance will have vested.
     * @param _beneficiary address of the beneficiary to whom vested tokens are transferred
     * @param _cliff duration in seconds of the cliff in which tokens will begin to vest
     * @param _duration duration in seconds of the period in which the tokens will vest
     */
    constructor(
        address _beneficiary,
        uint256 _start,
        uint256 _cliff,
        uint256 _duration
    ) {
        require(_beneficiary != address(0));
        require(_cliff <= _duration);

        beneficiary = _beneficiary;
        duration = _duration;
        cliff = _start.add(_cliff);
        start = _start;
    }

    /**
     * @notice Transfers vested tokens to beneficiary.
     * @param token ERC20 token which is being vested
     */
    function release(address token) public {
        uint256 unreleased = releasableAmount(token);

        require(unreleased > 0, "tokens cannot be released");

        released[token] = released[token].add(unreleased);

        SafeERC20.safeTransfer(IERC20(token), beneficiary, unreleased);

        emit Released(unreleased);
    }

    /**
     * @dev Calculates the amount that has already vested but hasn't been released yet.
     * @param token ERC20 token which is being vested
     */
    function releasableAmount(address token)
        public
        view
        virtual
        returns (uint256)
    {
        return vestedAmount(token).sub(released[token]);
    }

    /**
     * @dev Calculates the amount that has already vested.
     * @param token ERC20 token which is being vested
     */
    function vestedAmount(address token) public view virtual returns (uint256) {
        uint256 currentBalance = IERC20(token).balanceOf(address(this));
        uint256 totalBalance = currentBalance.add(released[token]);

        if (block.timestamp < cliff) {
            return 0;
        } else if (block.timestamp >= start.add(duration)) {
            return totalBalance;
        } else {
            return totalBalance.mul(block.timestamp.sub(start)).div(duration);
        }
    }
}
