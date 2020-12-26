/*

The public version of the file used for testing can be found here: https://gist.github.com/ConsenSys-Academy/7d59ba6ebe581c1ffcc981469e226c6e

This test file has been updated for Truffle version 5.0. If your tests are failing, make sure that you are
using Truffle version 5.0. You can check this by running "truffle version"  in the terminal. If version 5 is not
installed, you can uninstall the existing version with `npm uninstall -g truffle` and install the latest version (5.0)
with `npm install -g truffle`.

*/
let FractionalWaterAllocation = artifacts.require('FractionalWaterAllocation');
let exceptionHelpers = require("./exceptionsHelpers.js");
let catchUpdateReservoirWaterLevelByInvalidObserver = exceptionHelpers.catchUpdateReservoirWaterLevelByInvalidObserver;
let catchUpdateReservoirWaterLevelWithInvalidNumber = exceptionHelpers.catchUpdateReservoirWaterLevelWithInvalidNumber;
let catchNoAllocationPlanAvailableYet= exceptionHelpers.catchNoAllocationPlanAvailableYet;
let catchNewAllocationProposalSubmittedByInvalidMediator = exceptionHelpers.catchNewAllocationProposalSubmittedByInvalidMediator;
let catchFractionsNotSummingUptoHundred = exceptionHelpers.catchFractionsNotSummingUptoHundred;
let catchNumberOfBeneficiariesDoesnotMacthNumberOfFractions = exceptionHelpers.catchNumberOfBeneficiariesDoesnotMacthNumberOfFractions;
let catchVotingEndTimeEarlierThanVotingStartTime = exceptionHelpers.catchVotingEndTimeEarlierThanVotingStartTime;
let catchNewAllocationProposedBeforeThePreviousOneConcluded = exceptionHelpers.catchNewAllocationProposedBeforeThePreviousOneConcluded;
let catchVoteSubmittedByInvalidBeneficiary = exceptionHelpers.catchVoteSubmittedByInvalidBeneficiary;
let catchVoteSubmittedBeforeAllocationProposed = exceptionHelpers.catchVoteSubmittedBeforeAllocationProposed;
let catchVoteSubmittedEitherBeforeOrAfterVotingWindow = exceptionHelpers.catchVoteSubmittedEitherBeforeOrAfterVotingWindow;
let catchProposalNotAcceptedByAllBeneficiaries = exceptionHelpers.catchProposalNotAcceptedByAllBeneficiaries;
let catchMoreTimeLeftToConcludeVoting = exceptionHelpers.catchMoreTimeLeftToConcludeVoting;
let catchConcludeVotingInvalidMediator = exceptionHelpers.catchConcludeVotingInvalidMediator;

contract('FractionalWaterAllocation', function(accounts) {

    const owner = accounts[0];
    const beneficiaries = [accounts[1], accounts[2], accounts[3]];
    const mediatedBy = accounts[4];
    const observedBy = accounts[5];
    const reservoirCapacityUnit = "feet";
    const reservoirCapacity = 125500;

    let instance;

    beforeEach(async () => {
        instance = await FractionalWaterAllocation.new(owner, beneficiaries, mediatedBy, observedBy, reservoirCapacityUnit, reservoirCapacity);
    });

    it("should update the reservoir water level and emit a ReservoirLevelChange event", async() => {
        let reservoirWaterLevel = 99050;
        const tx = await instance.updateReservoirWaterLevel(reservoirWaterLevel, {from: observedBy});
        let eventEmitted = false;

        if (tx.logs[0].event == "ReservoirLevelChange") {
            eventEmitted = true;
        }

        assert.equal(eventEmitted, true, 'updating the reservoir level should emit a ReservoirLevelChange event');

        let result = await instance.retrieveReservoirWaterLevel();

        assert.equal(result['waterLevel'].toNumber(), reservoirWaterLevel, 'the reservoir water level returned by the contract does not match the last updated value');        
    });

    it("should revert if an address other than the observer attempts to update the reservoir water level", async() => {
        let reservoirWaterLevel = 99050;
        await catchUpdateReservoirWaterLevelByInvalidObserver(instance.updateReservoirWaterLevel(reservoirWaterLevel, {from: accounts[7]}));
    });

    it("should revert if reservoir water level is updated with a value that is not in the range of 0 and total reservoir capacity", async() => {
        let invalidReservoirWaterLevels = [125600, 125750];

        await catchUpdateReservoirWaterLevelWithInvalidNumber(instance.updateReservoirWaterLevel(invalidReservoirWaterLevels[0], {from: observedBy}));
        await catchUpdateReservoirWaterLevelWithInvalidNumber(instance.updateReservoirWaterLevel(invalidReservoirWaterLevels[1], {from: observedBy}));
    });


    it("mediator is able to propose a water allocation plan which results in the emit of NewAllocationSchemeProposed event", async() => {
        let beneficiaries = [accounts[1], accounts[2], accounts[3]];
        let fractions = [33, 33, 34];
        let currentTime = parseInt(new Date().getTime()/ 1000);
        let startTime = currentTime - 15 * 60;
        let endTime = currentTime + 15 * 60;
        const tx = await instance.proposeNewAllocation(beneficiaries, fractions, startTime, endTime, accounts[5], {from: accounts[4]});
        let eventEmitted = false;
        let i;

        if (tx.logs[0].event == "NewAllocationSchemeProposed") {
            eventEmitted = true;
        }

        assert.equal(eventEmitted, true, 'NewAllocationSchemeProposed event should be emitted when the mediator proposes a new allocation plan');

        let result = await instance.retrieveAllocationProposal();

        assert.equal(result['proposalVersion'].toNumber(), 0, 'the allocation proposal version do not not match');
        
        for(i=0; i<result['beneficiaries'].length; ++i) {
            assert.equal(result['beneficiaries'][i], beneficiaries[i], 'the benficiary at index ' + i + 'do not match');
            assert.equal(result['fractions'][i].toNumber(), fractions[i], 'the allocation fraction at index ' + i + 'do not match');
            assert.equal(result['votes'][i], false, 'the vote at index ' + i + 'cannot be true as the beneficiary at index ' + i + 'has not cast their vote yet');
        }

        assert.equal(result['votingStartTime'].toNumber(), startTime, 'the voting start time do not match');
        assert.equal(result['votingEndTime'].toNumber(), endTime, 'the voting end time do not match');
        assert.equal(result['proposalAcceptedByBeneficiaries'], false, 'proposal cannot be accepted by the beneficiaries before they had cast their vote');

    });

    it("should revert if somebody tries to retrieve an allocation proposal before the mediator proposes one", async() => {
        await catchNoAllocationPlanAvailableYet(instance.retrieveAllocationProposal({from: accounts[7]}));
    });

    it("should revert if an address other than the mediator attempts to propose a new allocation plan", async() => {
        let beneficiaries = [accounts[1], accounts[2], accounts[3]];
        let fractions = [33, 33, 34];
        let currentTime = parseInt(new Date().getTime()/ 1000);
        let startTime = currentTime - 15 * 60;
        let endTime = currentTime + 15 * 60;
        await catchNewAllocationProposalSubmittedByInvalidMediator(instance.proposeNewAllocation(beneficiaries, fractions, startTime, endTime, accounts[5], {from: accounts[7]}));
    });

    it("should revert if the fractions do not sum upto hundred", async() => {
        let beneficiaries = [accounts[1], accounts[2], accounts[3]];
        let fractions = [33, 33, 40];
        let currentTime = parseInt(new Date().getTime()/ 1000);
        let startTime = currentTime - 15 * 60;
        let endTime = currentTime + 15 * 60;
        await catchFractionsNotSummingUptoHundred(instance.proposeNewAllocation(beneficiaries, fractions, startTime, endTime, accounts[5], {from: accounts[4]}));
    });

    it("should revert if the number of beneficiaries does not match the number of fractions", async() => {
        let beneficiaries = [accounts[1], accounts[2], accounts[3]];
        let fractions = [33, 33];
        let currentTime = parseInt(new Date().getTime()/ 1000);
        let startTime = currentTime - 15 * 60;
        let endTime = currentTime + 15 * 60;
        await catchNumberOfBeneficiariesDoesnotMacthNumberOfFractions(instance.proposeNewAllocation(beneficiaries, fractions, startTime, endTime, accounts[5], {from: accounts[4]}));
    });

    it("should revert if voting end time earlir than voting start time", async() => {
        let beneficiaries = [accounts[1], accounts[2], accounts[3]];
        let fractions = [33, 33, 40];
        let currentTime = parseInt(new Date().getTime()/ 1000);
        let startTime = currentTime + 15 * 60;
        let endTime = currentTime - 15 * 60;
        await catchVotingEndTimeEarlierThanVotingStartTime(instance.proposeNewAllocation(beneficiaries, fractions, startTime, endTime, accounts[5], {from: accounts[4]}));
    });

    it("should revert if new allocation plan proposed before the previous one is concluded", async() => {
        let beneficiaries = [accounts[1], accounts[2], accounts[3]];
        let fractions = [33, 33, 34];
        let currentTime = parseInt(new Date().getTime()/ 1000);
        let startTime = currentTime - 15 * 60;
        let endTime = currentTime + 15 * 60;
        let startTime1 = endTime - 5 * 60; 
        await instance.proposeNewAllocation(beneficiaries, fractions, startTime, endTime, accounts[5], {from: accounts[4]});
        await catchNewAllocationProposedBeforeThePreviousOneConcluded(instance.proposeNewAllocation(beneficiaries, fractions, startTime1, endTime, accounts[5], {from: accounts[4]}));
    });

    it("beneficiaries are able to vote for allocation proposal during the voting window which results in the emit of VoteForNewAllocationProposal event", async() => {
        let beneficiaries = [accounts[1], accounts[2], accounts[3]];
        let fractions = [33, 33, 34];
        let currentTime = parseInt(new Date().getTime()/ 1000);
        let startTime = currentTime - 15 * 60;
        let endTime = currentTime + 15 * 60;
        await instance.proposeNewAllocation(beneficiaries, fractions, startTime, endTime, accounts[5], {from: accounts[4]});
        let tx;
        let eventEmitted;
        let i;

        for(i=0; i<beneficiaries.length; ++i) {
            eventEmitted = false;
            tx = await instance.voteForNewAllocationProposal({from: beneficiaries[i]});
            if (tx.logs[0].event == "VoteForNewAllocationProposal") {
                eventEmitted = true;
            }
            assert.equal(eventEmitted, true, 'VoteForNewAllocationProposal event should be emitted when a beneficiary votes for an allocation plan');
        }
    });

    it("should revert if an address other than one of the beneficiaries submits a vote for an allocation proposal", async() => {
        let beneficiaries = [accounts[1], accounts[2], accounts[3]];
        let fractions = [33, 33, 34];
        let currentTime = parseInt(new Date().getTime()/ 1000);
        let startTime = currentTime - 15 * 60;
        let endTime = currentTime + 15 * 60;
        instance.proposeNewAllocation(beneficiaries, fractions, startTime, endTime, accounts[5], {from: accounts[4]});
        await catchVoteSubmittedByInvalidBeneficiary(instance.voteForNewAllocationProposal({from: accounts[7]}));
    });

    it("should revert if a beneficiary submits a vote before an allocation plan is proposed", async() => {
        await catchVoteSubmittedBeforeAllocationProposed(instance.voteForNewAllocationProposal({from: beneficiaries[0]}));
    });

    it("should revert if a beneficiary submits a vote outside of voting window", async() => {
        let beneficiaries = [accounts[1], accounts[2], accounts[3]];
        let fractions = [33, 33, 34];
        let currentTime = parseInt(new Date().getTime()/ 1000);
        let startTime = currentTime - 15 * 60;
        let endTime = currentTime - 10 * 60;
        instance.proposeNewAllocation(beneficiaries, fractions, startTime, endTime, accounts[5], {from: accounts[4]});
        await catchVoteSubmittedEitherBeforeOrAfterVotingWindow(instance.voteForNewAllocationProposal({from: beneficiaries[0]}));
    });

    it("mediator is able to conclude voting which results in the emit of VotingConcluded event", async() => {
        let beneficiaries = [accounts[1], accounts[2], accounts[3]];
        let fractions = [33, 33, 34];
        let currentTime = parseInt(new Date().getTime()/ 1000);
        let startTime = currentTime - 15 * 60;
        let endTime = currentTime + 2 * 60;
        await instance.proposeNewAllocation(beneficiaries, fractions, startTime, endTime, accounts[5], {from: accounts[4]});
        let tx;
        let eventEmitted;
        let i;

        for(i=0; i<beneficiaries.length; ++i) {
            await instance.voteForNewAllocationProposal({from: beneficiaries[i]});
        }

        function timeout(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    
        await timeout(3 * 60 * 1000); // Lets add some delay to wait until after sometime past votingEndTime in the proposal

        tx = await instance.concludeVoting({from: accounts[4]});
        if (tx.logs[0].event == "VotingConcluded") {
            eventEmitted = true;
        }
        assert.equal(eventEmitted, true, 'VotingConcluded event should be emitted when the mediator concludes the voting');

    });

    it("should revert if an adress other than the mediator concludes the voting", async() => {
        let beneficiaries = [accounts[1], accounts[2], accounts[3]];
        let fractions = [33, 33, 34];
        let currentTime = parseInt(new Date().getTime()/ 1000);
        let startTime = currentTime - 15 * 60;
        let endTime = currentTime + 2 * 60;
        await instance.proposeNewAllocation(beneficiaries, fractions, startTime, endTime, accounts[5], {from: accounts[4]});
        let i;

        for(i=0; i<beneficiaries.length; ++i) {
            await instance.voteForNewAllocationProposal({from: beneficiaries[i]});
        }

        function timeout(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    
        await timeout(3 * 60 * 1000); // Lets add some delay to wait until after sometime past votingEndTime in the proposal
        await catchConcludeVotingInvalidMediator(instance.concludeVoting({from: accounts[7]}));
    });

    it("should revert if the mediator concludes voting earlier than proposed voting end time", async() => {
        let beneficiaries = [accounts[1], accounts[2], accounts[3]];
        let fractions = [33, 33, 34];
        let currentTime = parseInt(new Date().getTime()/ 1000);
        let startTime = currentTime - 15 * 60;
        let endTime = currentTime + 15 * 60;
        await instance.proposeNewAllocation(beneficiaries, fractions, startTime, endTime, accounts[5], {from: accounts[4]});
        let i;

        for(i=0; i<beneficiaries.length; ++i) {
            await instance.voteForNewAllocationProposal({from: beneficiaries[i]});
        }

        function timeout(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    
        await timeout(1000); // The delay is much lesser than the votingEndTime in the proposal
        await catchMoreTimeLeftToConcludeVoting(instance.concludeVoting({from: accounts[4]}));
    });

    it("should revert if one or more beneficiary does not vote during the voting window or they don't accept the allocation proposal", async() => {
        let beneficiaries = [accounts[1], accounts[2], accounts[3]];
        let fractions = [33, 33, 34];
        let currentTime = parseInt(new Date().getTime()/ 1000);
        let startTime = currentTime - 15 * 60;
        let endTime = currentTime + 2 * 60;
        await instance.proposeNewAllocation(beneficiaries, fractions, startTime, endTime, accounts[5], {from: accounts[4]});
        let i;

        for(i=0; i<beneficiaries.length - 1; ++i) { // Let one beneficiary don't vote
            await instance.voteForNewAllocationProposal({from: beneficiaries[i]});
        }

        function timeout(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    
        await timeout(3 * 60 * 1000); // Lets add some delay to wait until after sometime past votingEndTime in the proposal
        await catchProposalNotAcceptedByAllBeneficiaries(instance.concludeVoting({from: accounts[4]}));
    });

    it("the new allocation plan can be retrieved by public after the voting concluded successfully (full protocol simulation)", async() => {
        let beneficiaries = [accounts[1], accounts[2], accounts[3]];
        let fractions = [33, 33, 34];
        let currentTime = parseInt(new Date().getTime()/ 1000);
        let startTime = currentTime - 15 * 60;
        let endTime = currentTime + 2 * 60;
        let i;

        // step 1 - mediator proposes an allocation
        await instance.proposeNewAllocation(beneficiaries, fractions, startTime, endTime, accounts[5], {from: accounts[4]});

        // step 2 - allocation proposal is available to beneficiaries/ public
        let result = await instance.retrieveAllocationProposal();

        assert.equal(result['proposalVersion'].toNumber(), 0, 'the allocation proposal version do not not match');
        
        for(i=0; i<result['beneficiaries'].length; ++i) {
            assert.equal(result['beneficiaries'][i], beneficiaries[i], 'the benficiary at index ' + i + 'do not match');
            assert.equal(result['fractions'][i].toNumber(), fractions[i], 'the allocation fraction at index ' + i + 'do not match');
        }

        // step 3 - the beneficiaries vote for the proposal during voting window
        for(i=0; i<beneficiaries.length; ++i) { 
            await instance.voteForNewAllocationProposal({from: beneficiaries[i]});
        }

        function timeout(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        
        // step 4 - the mediator concludes the voting process sometime after the votingEndTime in the proposal
        await timeout(3 * 60 * 1000);
        await instance.concludeVoting({from: accounts[4]});

        // step 4 - after the voting process concluded, the allocation plan can be retrieved by public

        result = await instance.retrieveWaterAllocation({from: accounts[7]}); // water allocation plan retrieved from account 8 (public)

        assert.equal(result['version'].toNumber(), 0, 'the allocation version do not not match');
        
        for(i=0; i<result['beneficiaries'].length; ++i) {
            assert.equal(result['beneficiaries'][i], beneficiaries[i], 'the benficiary at index ' + i + 'do not match');
            assert.equal(result['fractions'][i].toNumber(), fractions[i], 'the allocation fraction at index ' + i + 'do not match');
        }

    });

});
