pragma solidity ^0.5.0;

import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/crowdsale/Crowdsale.sol";
import "./RefundPostDeliveryCrowdsale.sol";
import "./EscrowRefund.sol";

contract ICO is Ownable, Crowdsale, RefundPostDeliveryCrowdsale {
    using SafeMath for uint256;

    IERC20 private tokens;
    EscrowRefund private escrow_;

    uint256 public privateSaleICOQuantity = 23333333333 * 10**18;
    uint256 public publicSaleICOQuantity = 54444444444 * 10**18;
    uint256 constant MAX_TOKEN_LIMIT = 77777778 * 10**18;
    uint256 privateRate;
    uint256 publicRate;
    mapping(address => uint256) private weiPurchased;

    enum ICOStage {
        privateICO,
        publicICO
    }

    ICOStage public stage = ICOStage.privateICO;

    constructor(
        uint256 rate_,
        address payable wallet_,
        IERC20 token_,
        uint256 openingTime_,
        uint256 closingTime_,
        uint256 goal_
    )
        public
        Crowdsale(rate_, wallet_, token_)
        TimedCrowdsale(openingTime_, closingTime_)
        RefundableCrowdsales(goal_)
    {
        escrow_ = new EscrowRefund(wallet());
        privateRate = 5400000;
        publicRate = 3780000;
    }

    event StageChange(uint256 stageNo);
    event BuyBack(address user, uint256 tokenAmount);

    function changeStage(uint256 _stage) external onlyOwner {
        if (_stage == 0) {
            stage = ICOStage.privateICO;
        } else {
            stage = ICOStage.publicICO;
        }
        emit StageChange(_stage);
    }

    function buyBack() public payable onlyWhileOpen {
        _balances[msg.sender] = 0;
        escrow_.withdraw(msg.sender);
        emit BuyBack(msg.sender, _balances[msg.sender]);
    }

    function rate() public view returns (uint256) {
        return calculateRate();
    }

    function calculateRate() internal view returns (uint256) {
        if (stage == ICOStage.privateICO) {
            //currentRate = 5400000;
            return privateRate;
        } else {
            //currentRate = 3780000;
            return publicRate;
        }
    }

    function _getTokenAmount(uint256 weiAmount)
        internal
        view
        returns (uint256)
    {
        return (weiAmount.mul(calculateRate()));
    }

    function _processPurchase(address beneficiary, uint256 tokenAmount)
        internal
    {
        require(
            MAX_TOKEN_LIMIT >= tokenAmount &&
                MAX_TOKEN_LIMIT >= (_balances[beneficiary] + tokenAmount),
            "Maximum token amount reached"
        );
        if (stage == ICOStage.privateICO) {
            privateSaleICOQuantity = (privateSaleICOQuantity.sub(tokenAmount));

            if (privateSaleICOQuantity == 0) {
                stage = ICOStage.publicICO;
            }
        }
        if (stage == ICOStage.publicICO) {
            publicSaleICOQuantity = (publicSaleICOQuantity.sub(tokenAmount));
        }
        super._processPurchase(beneficiary, tokenAmount);
    }

    function changeRate(uint256 newRate, uint256 _stage) external onlyOwner {
        if (_stage == 0) {
            stage = ICOStage.privateICO;
            privateRate = newRate;
        } else {
            stage = ICOStage.publicICO;
            publicRate = newRate;
        }
    }
}