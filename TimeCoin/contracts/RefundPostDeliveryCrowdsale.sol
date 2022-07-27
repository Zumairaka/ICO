pragma solidity ^0.5.0;

import "./RefundableCrowdsales.sol";

//import "./PostDeliveryCrowdsales.sol";

/**
 * @title RefundablePostDeliveryCrowdsale
 * @dev Extension of RefundableCrowdsale contract that only delivers the tokens
 * once the crowdsale has closed and the goal met, preventing refunds to be issued
 * to token holders.
 */
contract RefundPostDeliveryCrowdsale is
    RefundableCrowdsales //,
    //PostDeliveryCrowdsales
{
    function withdrawTokens(address beneficiary) public {
        require(finalized(), "RefundablePostDeliveryCrowdsale: not finalized");
        require(
            goalReached(),
            "RefundablePostDeliveryCrowdsale: goal not reached"
        );

        super.withdrawTokens(beneficiary);
    }
}
