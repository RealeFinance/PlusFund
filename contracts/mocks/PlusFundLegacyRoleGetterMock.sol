// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {PlusFund} from "../token/PlusFund.sol";

/// @dev Test-only stand-in for the pre-rename implementation ABI.
/// @custom:oz-upgrades-unsafe-allow missing-initializer
contract PlusFundLegacyRoleGetterMock is PlusFund {
    function STOKEN_ADMIN() external pure returns (bytes32) {
        return 0x1af9f09295e73130ad6fd58704a26fe468d3f3e194879e90badd83ab85dd89f9;
    }
}
