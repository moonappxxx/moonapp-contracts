// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./TokenVesting.sol";
import "./MoonappToken.sol";

contract Seed {
    using SafeMath for uint256;
    using SafeERC20 for MoonappToken;

    address[] public investors;
    mapping(address => uint256) public investorTokens;
    mapping(address => address) public investorVestings;

    address public admin;
    uint256 public availableTokens;
    uint256 public startTime;

    MoonappToken public token;

    constructor(address tokenAddress, uint256 _availableTokens) {
        token = MoonappToken(tokenAddress);
        admin = msg.sender;

        availableTokens = _availableTokens * (10**18);
    }

    function changeAdmin(address newAdmin) external {
        require(msg.sender == admin, "only admin");
        admin = newAdmin;
    }

    function addInvestor(address _investor, uint256 _tokensAmount) external {
        uint256 amount = _tokensAmount * (10**18);
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
            amount <= availableTokens,
            "ADD_INVESTOR: not enought tokens left."
        );
        require(amount > 0, "ADD_INVESTOR: only investors.");

        investors.push(_investor);
        investorTokens[_investor] = amount;
    }

    function releaseTokens(
        uint256 _start,
        uint256 _cliff,
        uint256 _releaseRate,
        uint256 _initialReleaseRate
    ) external {
        require(msg.sender == admin, "only admin");
        require(startTime == 0, "tokens already released");
        startTime = _start;

        uint256 investorsCount = investors.length;

        for (uint256 i = 0; i < investorsCount; i++) {
            if (investorVestings[investors[i]] != address(0x0)) continue;

            uint256 tokensAmount = investorTokens[investors[i]];
            uint256 initialReleaseAmont = (tokensAmount / 100) *
                _initialReleaseRate; // release % of the tokens on listing

            TokenVesting vesting = new TokenVesting(
                investors[i],
                startTime,
                _cliff,
                _releaseRate,
                initialReleaseAmont
            );

            SafeERC20.safeTransfer(
                IERC20(token),
                address(vesting),
                tokensAmount
            );

            investorVestings[investors[i]] = address(vesting);
        }
    }

    function getInvestors() external view returns (address[] memory) {
        return investors;
    }

    function getInvestorBalance(address _investor)
        external
        view
        returns (uint256)
    {
        return investorTokens[_investor];
    }

    function getInvestorVestingAddress(address _investor)
        external
        view
        returns (address)
    {
        return investorVestings[_investor];
    }
}
