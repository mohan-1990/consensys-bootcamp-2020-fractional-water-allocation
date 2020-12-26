var FractionalWaterAllocation = artifacts.require("FractionalWaterAllocation")

module.exports = function(deployer, network, accounts) {

    const owner = accounts[0];
    const benefeciaries = [accounts[1], accounts[2], accounts[3]];
    const mediator = accounts[4];
    const observer = accounts[5];
    const reservoirCapacityUnit = "feet";
    const reservoirCapacity = 125500;

    deployer.deploy(FractionalWaterAllocation, owner, benefeciaries, mediator, observer, reservoirCapacityUnit, reservoirCapacity);
};