const errorString = "VM Exception while processing transaction: ";

async function tryCatch(promise, reason) {
    try {
        await promise;
        throw null;
    }
    catch (error) {
        assert(error, "Expected a VM exception but did not get one");
        assert(error.message.search(errorString + reason) >= 0, "Expected an error containing '" + errorString + reason + "' but got '" + error.message + "' instead");
    }
};

module.exports = {
    catchRevert            : async function(promise) {await tryCatch(promise, "revert"             );},
    catchOutOfGas          : async function(promise) {await tryCatch(promise, "out of gas"         );},
    catchInvalidJump       : async function(promise) {await tryCatch(promise, "invalid JUMP"       );},
    catchInvalidOpcode     : async function(promise) {await tryCatch(promise, "invalid opcode"     );},
    catchStackOverflow     : async function(promise) {await tryCatch(promise, "stack overflow"     );},
    catchStackUnderflow    : async function(promise) {await tryCatch(promise, "stack underflow"    );},
    catchStaticStateChange : async function(promise) {await tryCatch(promise, "static state change");},

    catchUpdateReservoirWaterLevelByInvalidObserver : async function(promise) {await tryCatch(promise, "revert Valid observer can only provide a request to update reservoir water level");},
    catchUpdateReservoirWaterLevelWithInvalidNumber : async function(promise) {await tryCatch(promise, "revert Water level needs to be greater than 0 and less than total reservoir capacity");},
    catchNoAllocationPlanAvailableYet : async function(promise) {await tryCatch(promise, "revert No allocations proposed so far. Please come back here after an allocation plan is proposed.");},
    catchNewAllocationProposalSubmittedByInvalidMediator : async function(promise) {await tryCatch(promise, "revert Valid mediator can only propose new water allocation scheme");},
    catchFractionsNotSummingUptoHundred : async function(promise) {await tryCatch(promise, "revert Allocation fractions not summing upto one");},
    catchNumberOfBeneficiariesDoesnotMacthNumberOfFractions : async function(promise) {await tryCatch(promise, "revert Number of beneficiaries and allocation fraction proposals do not match");},
    catchVotingEndTimeEarlierThanVotingStartTime: async function(promise) {await tryCatch(promise, "revert Voting end time needs to be greater than voting start time");},
    catchNewAllocationProposedBeforeThePreviousOneConcluded: async function(promise) {await tryCatch(promise, "revert There is another proposal currently in voting stage");},
    catchVoteSubmittedByInvalidBeneficiary: async function(promise) {await tryCatch(promise, "revert Valid beneficiary can only vote for new water allocation scheme");},
    catchVoteSubmittedBeforeAllocationProposed: async function(promise) {await tryCatch(promise, "revert No allocation proposed so far. You need to wait until the mediator proposes an allocation scheme");},
    catchVoteSubmittedEitherBeforeOrAfterVotingWindow: async function(promise) {await tryCatch(promise, "revert Either voting has not begun yet or closed already.");},
    catchProposalNotAcceptedByAllBeneficiaries: async function(promise) {await tryCatch(promise, "revert Proposal not accepted by all beneficiaries. Please retrieve the allocation proposal to check the list of disagreeing beneficiaries.");},
    catchMoreTimeLeftToConcludeVoting: async function(promise) {await tryCatch(promise, "revert There is still some time left for voting to conclude. You need to wait until the voting end time proposed in the allocation scheme.");},
    catchConcludeVotingInvalidMediator: async function(promise) {await tryCatch(promise, "revert Valid mediator can only conclude voting for new water allocation scheme");}
};
