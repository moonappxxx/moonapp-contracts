// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./TokenVesting.sol";
import "./MoonappToken.sol";

contract Seed {
    using SafeMath for uint256;

    address[] public investors;

    mapping(address => uint256) public investorTokens;

    address public admin;
    uint256 public availableTokens;
    uint256 public price;
    uint256 public startTime;
    uint256 public lockDuration;
    MoonappToken public token;

    constructor(address tokenAddress, uint256 _availableTokens) {
        token = MoonappToken(tokenAddress);
        admin = msg.sender;

        availableTokens = _availableTokens;
    }

    function changeAdmin(address newAdmin) external {
        require(msg.sender == admin, "only admin");
        admin = newAdmin;
    }

    function addInvestor(address _investor, uint256 _tokensAmount) external {
        require(msg.sender == admin, "only admin");
        require(
            _investor != address(0),
            "ADD_INVESTOR: The investors's address cannot be 0"
        );
        require(
            investorTokens[_investor] == 0,
            "ADD_INVESTOR: you can add investor only once."
        );
        require(
            _tokensAmount <= availableTokens,
            "ADD_INVESTOR: not enought tokens left."
        );

        token.mint(address(this), _tokensAmount);

        if (investorTokens[_investor] == 0) {
            investors.push(_investor);
        }

        investorTokens[_investor] = _tokensAmount;
    }

    function releaseTokens(
        uint256 _start,
        uint256 _cliff,
        uint256 _duration
    ) external {
        require(msg.sender == admin, "only admin");
        require(startTime == 0, "tokens already released");
        startTime = _start;

        uint256 investorsCount = investors.length;

        for (uint256 i = 0; i < investorsCount; i++) {
            uint256 tokensAmount = investorTokens[investors[i]];

            if (tokensAmount > 0) {
                uint256 initialReleaseAmont = (tokensAmount / 100) * 10; // release 10% of the tokens on listing
                uint256 vestingAmount = tokensAmount.div(initialReleaseAmont);
                TokenVesting vesting = new TokenVesting(
                    investors[i],
                    startTime,
                    _cliff,
                    _duration
                );

                release(investors[i], initialReleaseAmont);
                release(address(vesting), vestingAmount);
            }
        }
    }

    function release(address _beneficiary, uint256 _amount) private {
        SafeERC20.safeTransfer(IERC20(token), _beneficiary, _amount);
    }
}
