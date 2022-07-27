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
    uint256 public MAX_TOKEN_LIMIT = 77777778 * 10**18;
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
        privateRate = rate_;
        publicRate = 3780000;
    }

    event StageChange(address indexed owner, ICOStage stageNo);
    event BuyBack(address indexed user, uint256 tokenAmount);
    event ChangeRate(address indexed owner, uint256 updateRate, ICOStage stage);

    function changeStage(ICOStage _stage) external onlyOwner {
        if (_stage == ICOStage.privateICO) {
            stage = ICOStage.privateICO;
        } else if (_stage == ICOStage.publicICO) {
            stage = ICOStage.publicICO;
        }
        emit StageChange(msg.sender, _stage);
    }

    function changeRate(uint256 newRate, ICOStage _stage) external onlyOwner {
        if (_stage == ICOStage.privateICO) {
            privateRate = newRate;
        } else if (_stage == ICOStage.publicICO) {
            publicRate = newRate;
        }
        emit ChangeRate(msg.sender, newRate, _stage);
    }

    function buyBack() external payable onlyWhileOpen {
        require(_balances[msg.sender] != 0, "Insufficient tokens");
        _balances[msg.sender] = 0;
        escrow_.withdraw(msg.sender);
        emit BuyBack(msg.sender, _balances[msg.sender]);
    }

    function rate() public view returns (uint256) {
        return calculateRate();
    }

    function calculateRate() internal view returns (uint256) {
        if (stage == ICOStage.privateICO) {
            return privateRate;
        } else {
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
        // checking Anti-whale condition
        require(
            MAX_TOKEN_LIMIT >= tokenAmount &&
                MAX_TOKEN_LIMIT >= (_balances[beneficiary] + tokenAmount),
            "Maximum token amount reached"
        );
        if (stage == ICOStage.privateICO) {
            require(
                privateSaleICOQuantity >= tokenAmount,
                "Private sale:Insufficient balance"
            );
            privateSaleICOQuantity = (privateSaleICOQuantity.sub(tokenAmount));
        }
        if (stage == ICOStage.publicICO) {
            require(
                publicSaleICOQuantity >= tokenAmount,
                "Public sale:Insufficient balance"
            );
            publicSaleICOQuantity = (publicSaleICOQuantity.sub(tokenAmount));
        }
        super._processPurchase(beneficiary, tokenAmount);
    }
}
