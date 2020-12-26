const Web3 = require('web3');
const contract = require('truffle-contract');
const fwacjson = require('../build/contracts/FractionalWaterAllocation.json');


// Read JSON and attach RPC connection (Provider)
var fwac = contract(fwacjson);
var provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545");
var web3 = new Web3(provider);
fwac.setProvider(provider);
var contractInstance = null;
var accounts = null;

// Fractional Water Allocation Contract current instance constants

var contractInstanceConstants;

function init() {
    web3.eth.getAccounts().then(function(ac) {        
        accounts = ac;
        let mnemonic = "option arctic cage edit sick forward invite inquiry apple island pilot similar";
        for(let i=0; i<accounts.length; ++i) {
            web3.eth.personal.unlockAccount(accounts[i], mnemonic);
        } 
        console.log("Middleware initialized.");
        console.log("Available accounts: " + JSON.stringify(accounts));
    });
}

function initContract(owner, beneficiaries, mediatedBy, observedBy, reservoirCapacityUnit, reservoirCapacity) {
    return new Promise(function(resolve, reject) {
        console.log("Middleware initContract. Params: " + owner + ", " + 
        beneficiaries + ", " + mediatedBy + ", " + observedBy + ", " + 
        reservoirCapacityUnit + ", " + reservoirCapacity);

        fwac.new(owner, beneficiaries, mediatedBy, observedBy, reservoirCapacityUnit, reservoirCapacity, {from: owner}).then(function(instance) {
            // console.log("Middleware initContract response: " + JSON.stringify(instance));
            contractInstance = instance;   
            contractInstanceConstants = {
                'availabeAccounts': accounts,
                'owner': owner,
                'beneficiaries': beneficiaries,
                'mediatedBy': mediatedBy,
                'observedBy': observedBy
            };
            console.log("Middleware initContract: Fractional Water Allocation Contract initialized successfully.");                     
            resolve(true);
        }).catch(function(exception) {
            console.log("Middleware initContract exception: " + exception);
            reject(exception);
        });
    });
}

function retrieveCurrentTimestamp(fromAccount) {

    return new Promise(function(resolve, reject) {        
        contractInstance.retrieveCurrentTimestamp({from: fromAccount}).then(function(timeStamp) {
            resolve(timeStamp.toNumber());
        }).catch(function(exception) {
            reject(exception);
        });
    });    
}

function updateReservoirWaterLevel(waterLevel, fromAccount) {
    return new Promise(function(resolve, reject) {        
        contractInstance.updateReservoirWaterLevel(waterLevel, {from: fromAccount}).then(function(transaction) {
            console.log("Middleware updateReservoirWaterLevel: " + JSON.stringify(transaction));
            resolve(transaction);
        }).catch(function(exception) {
            console.log("Middleware updateReservoirWaterLevel exception: " + exception);
            reject(exception);
        });
    });
}

function retrieveReservoirWaterLevel(fromAccount) {
    return new Promise(function(resolve, reject) {        
        contractInstance.retrieveReservoirWaterLevel({from: fromAccount}).then(function(result) {
            console.log("Middleware retrieveReservoirWaterLevel: " + JSON.stringify(result));
            let waterLevelDetails = {
                'version': result['version'].toNumber(),
                'waterLevel': result['waterLevel'].toNumber(),
                'observedBy': result['observedBy'],
                'observedTime': result['observedTime'].toNumber()
            };

            resolve(waterLevelDetails);
        }).catch(function(exception) {
            console.log("Middleware exception retrieveReservoirWaterLevel: " + exception);
            reject(exception);
        });
    });
}

function proposeAllocation(beneficiaries, fractions, startTime, endTime, observedBy, mediatedBy) {
    return new Promise(function(resolve, reject) {   
        console.log("Middleware proposeAllocation. Params: " + beneficiaries + ", " + 
        fractions + ", " + startTime + ", " + endTime + ", " + 
        observedBy + ", " + mediatedBy);     
        contractInstance.proposeNewAllocation(beneficiaries, fractions, startTime, endTime, observedBy, {from: mediatedBy}).then(function(transaction) {
            console.log("Middleware new allocation proposed successfully.");
            resolve(transaction);
        }).catch(function(exception) {
            console.log("Middleware exception proposeAllocation: " + exception);
            reject(exception);
        });
    });
}

function retrieveAllocationProposal(fromAccount) {
    return new Promise(function(resolve, reject) {        
        contractInstance.retrieveAllocationProposal({from: fromAccount}).then(function(result) {

        let allocationProposal = {};
        allocationProposal['proposalVersion'] = result['proposalVersion'].toNumber();
        allocationProposal['fractions'] = [];
        allocationProposal['beneficiaries'] = result['beneficiaries'];
        allocationProposal['votes'] = result['votes'];
        
        for(i=0; i<result['fractions'].length; ++i) {
            allocationProposal['fractions'].push(result['fractions'][i].toNumber());            
        }

        allocationProposal['votingStartTime'] = result['votingStartTime'].toNumber();
        allocationProposal['votingEndTime'] = result['votingEndTime'].toNumber();
        allocationProposal['proposalAcceptedByBeneficiaries'] = result['proposalAcceptedByBeneficiaries'];

        console.log("Middleware retrieveAllocationProposal: " + JSON.stringify(result));

        resolve(allocationProposal);

        }).catch(function(exception) {
            console.log("Middleware exception retrieveAllocationProposal: " + exception);
            reject(exception);
        });
    });
}

function voteForAllocationProposal(fromAccount) {
    return new Promise(function(resolve, reject) {        
        contractInstance.voteForNewAllocationProposal({from: fromAccount}).then(function(transaction) {
            console.log("Middleware voteForAllocationProposal: " + JSON.stringify(transaction));
            resolve(transaction);
        }).catch(function(exception) {
            console.log("Middleware exception voteForAllocationProposal: " + exception);
            reject(exception);
        });
    });
}

function concludeVoting(fromAccount) {
    return new Promise(function(resolve, reject) {        
        contractInstance.concludeVoting({from: fromAccount}).then(function(transaction) {
            console.log("Middleware concludeVoting: " + JSON.stringify(transaction));
            resolve(transaction);
        }).catch(function(exception) {
            console.log("Middleware exception concludeVoting: " + exception);
            reject(exception);
        });
    });
}

function retrieveAllocationPlan(fromAccount) {
    return new Promise(function(resolve, reject) {        
        contractInstance.retrieveWaterAllocation({from: fromAccount}).then(function(result) {

        let allocationPlan = {};
        allocationPlan['version'] = result['version'].toNumber();
        allocationPlan['fractions'] = [];
        allocationPlan['beneficiaries'] = result['beneficiaries'];
        
        for(i=0; i<result['fractions'].length; ++i) {
            allocationPlan['fractions'].push(result['fractions'][i].toNumber());            
        }

        allocationPlan['proposedTime'] = result['proposedTime'].toNumber();
        allocationPlan['allocationTime'] = result['allocationTime'].toNumber();
        allocationPlan['mediatedBy'] = result['mediatedBy'];
        allocationPlan['observedBy'] = result['observedBy'];

        console.log("Middleware retrieveAllocationPlan: " + JSON.stringify(result));

        resolve(allocationPlan);

        }).catch(function(exception) {
            console.log("Middleware exception retrieveAllocationPlan: " + exception);
            reject(exception);
        });
    });
}

function contractInstanceConstants() {
    return new Promise(function(resolve, reject) {
        resolve(contractInstanceConstants);
    });
}

function getAvailableAccounts() {
    return new Promise(function(resolve, reject) {
        resolve(accounts);
    });
}

module.exports = {
    init: init,
    initContract: initContract,
    retrieveCurrentTimestamp: retrieveCurrentTimestamp,
    updateReservoirWaterLevel: updateReservoirWaterLevel,
    retrieveReservoirWaterLevel: retrieveReservoirWaterLevel,
    proposeAllocation: proposeAllocation,
    retrieveAllocationProposal: retrieveAllocationProposal,
    voteForAllocationProposal: voteForAllocationProposal,
    concludeVoting: concludeVoting,
    retrieveAllocationPlan: retrieveAllocationPlan,
    getAvailableAccounts: getAvailableAccounts,
    contractInstanceConstants: contractInstanceConstants
}