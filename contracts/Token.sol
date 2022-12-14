pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract Token is ERC20 {
    using SafeMath for uint256;
    address public admin;
    uint256 public maxTotalSupply;

    constructor(
        string memory name,
        string memory symbol,
        uint256 _maxTotalSupply
    ) ERC20(name, symbol) {
        admin = msg.sender;
        maxTotalSupply = _maxTotalSupply;
    }

    function updateAdmin(address newAdmin) external {
        require(msg.sender == admin, "only admin");
        admin = newAdmin;
    }

    function mint(address account, uint256 amount) external {
        require(msg.sender == admin, "only admin");
        uint256 totalSupply = totalSupply();
        require(
            totalSupply.add(amount) <= maxTotalSupply,
            "above maxTotalSupply limit"
        );
        _mint(account, amount);
    }
}
