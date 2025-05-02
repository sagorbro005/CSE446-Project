// requiring the contract
var MissingPersons = artifacts.require("./MissingPersons.sol");

// exporting as module 
 module.exports = function(deployer) {
  deployer.deploy(MissingPersons);
 };
