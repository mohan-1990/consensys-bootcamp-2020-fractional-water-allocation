// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.8.0;

contract FractionalWaterAllocation {

    // User roles
    enum Role {
        Beneficiary,
        Mediator,
        Observer
    }


    // Definitions of users in the contract

    struct User {
        string name;
        Role role;
        bool isActive;
        uint activeSince; // Unix timestamp 
    }
    
    address owner;

    mapping(address => User) users;

    // Measurement unit of the reservoir

    string reservoirCapacityUnit;

    // Reservoir state representation

    uint totalReservoirCapacity; // Ideally we want to save totalCapacity as a real number(ufixed type in solidity). For example 99.50. 
    // But solidity cannot support ufixed types yet so we fallback to using uint. The value stored in totalReservoirCapacity is
    // interpreted as 2 digits from the right for decimal part and the rest for magnitude part. For example the number 299.50 needs to stored as 29950
    
    uint reservoirStateVersion;
    struct ReservoirState {
        uint waterLevel;
        address observedBy;
        uint observedTime; // Unix timestamp
    }

    // Timeline of reservoir state changes.

    mapping(uint => ReservoirState) reservoirStateHistory;

    // Beneficiary water entitlement representation

    uint waterAllocationCurrentVersion;
    struct WaterAllocation {
        mapping(address => uint) allocations; // Ideally we want to save allocations as a real number(ufixed type in solidity). For example 0.25 or 0.50. 
    // But solidity cannot support ufixed types yet so we fallback to using uint. The value stored in allocations is
    // interpreted as 2 digits from the right for decimal part and with a leading zero. For example the fraction 0.50 needs to stored as 050 (or simply 50)
    // and 0.01 as 001 (or simply 1). To ensure the fractions are keyed in properly we will add them and see if the sum is 100.
        address[] beneficiaries;
        address mediatedBy;
        address observedBy;
        uint proposedTime; // Unix timestamp
        uint allocationTime; // Unix timestamp
    }

    // Timeline of water allocation to beneficiaries.

    mapping(uint => WaterAllocation) waterAllocationHistory;

    // Water allocation new proposal
    struct NewAllocationProposal {
        mapping(address => uint) allocations;
        mapping(address => bool) votes;
        address[] beneficiaries;
        uint[] fractions;
        address mediatedBy;
        address observedBy;
        uint votingStartTime;
        uint votingEndTime;
        bool proposalAcceptedByBeneficiaries;        
    }

    mapping(uint => NewAllocationProposal) waterAllocationProposals;
    uint waterAllocationProposalCurrentVersion;

    modifier validRequirementUsers(address[] memory beneficiaries, address mediator, address observer) {
        require(beneficiaries.length > 1, "Atleast two beneficiaries required");        
        _;
    }

    modifier validRequirementOthers(string memory capacityUnit, uint capacity) {        
        require(keccak256(bytes(capacityUnit)) == keccak256(bytes("feet")) || 
        keccak256(bytes(capacityUnit)) == keccak256(bytes("meter")), "Reservoir capacity unit needs to be either feet or meter");
        require(capacity > 0, "Reservoir capacity needs to be greater than zero");
        _;
    }

    modifier validRequirementsUpdateWaterLevel(address sender, uint waterLevel) {
        User storage user = users[sender];
        require(user.role == Role.Observer && user.isActive == true, "Valid observer can only provide a request to update reservoir water level");

        
        require(waterLevel > 0 && waterLevel <= totalReservoirCapacity, "Water level needs to be greater than 0 and less than total reservoir capacity");
        // If waterLevel is more than total reservoir capacity it may be an emergency situtation. 
        // For now let's reduce the scope of this contract to not handle this situation.
        // One possible way to handle possible flooding situation:- 
        // This contarct may define another state variable to emit an flood event let's say at 75% or 80% of total reservoir capacity
        _;
    }    

    modifier validRequirementsNewAllocations(address[] memory beneficiaries, uint[] memory fractions, uint votingStartTime, uint votingEndTime, address observer, address sender) {        
        uint i;
        uint fractionsTotal = 0;

        require(beneficiaries.length == fractions.length, "Number of beneficiaries and allocation fraction proposals do not match");

        for(i=0; i<beneficiaries.length; ++i) {
            require(users[beneficiaries[i]].role == Role.Beneficiary && users[beneficiaries[i]].isActive == true, string(abi.encodePacked("Beneficiary provided at index ", i, " is either invalid or inactive")));            
        }

        require(users[sender].role == Role.Mediator && users[sender].isActive == true, "Valid mediator can only propose new water allocation scheme");
        require(users[observer].role == Role.Observer && users[observer].isActive == true, "Valid observer can only participate in new water allocation scheme");
        if(waterAllocationProposalCurrentVersion > 0) {
            require(waterAllocationProposals[waterAllocationProposalCurrentVersion - 1].votingEndTime < block.timestamp, "There is another proposal currently in voting stage");
        }
        
        require(votingStartTime < votingEndTime, "Voting end time needs to be greater than voting start time");

        for(i=0; i<fractions.length; ++i) {
            require(fractions[i] > 0 && fractions[i] < 100, string(abi.encodePacked("Allocation fraction at index ", i, " needs to be keyed in properly format")));
            fractionsTotal += fractions[i];
        }

        require(fractionsTotal == 100, "Allocation fractions not summing upto one");

        _;
    }

    modifier validRequirementsVoteForNewAllocation(address sender) {
        uint version = waterAllocationProposalCurrentVersion - 1;
        User storage user = users[sender];
        require(user.role == Role.Beneficiary && user.isActive == true, "Valid beneficiary can only vote for new water allocation scheme");
        require(waterAllocationProposalCurrentVersion > 0, "No allocation proposed so far. You need to wait until the mediator proposes an allocation scheme");
        require(waterAllocationProposals[version].votingStartTime < block.timestamp && waterAllocationProposals[version].votingEndTime > block.timestamp, "Either voting has not begun yet or closed already.");
        
        _;
    }

    modifier validRequirementsConcludeVoting(address sender) {

        require(waterAllocationProposalCurrentVersion > 0, "No allocation has been proposed yet. The mediator needs to propose an allocation scheme first.");

        NewAllocationProposal storage latestAllocationProposal = waterAllocationProposals[waterAllocationProposalCurrentVersion - 1];

        require(latestAllocationProposal.mediatedBy == sender, "Valid mediator can only conclude voting for new water allocation scheme");
        require(latestAllocationProposal.votingEndTime < block.timestamp, "There is still some time left for voting to conclude. You need to wait until the voting end time proposed in the allocation scheme.");

        for(uint i=0; i<latestAllocationProposal.beneficiaries.length; ++i) {
            require(latestAllocationProposal.votes[latestAllocationProposal.beneficiaries[i]] == true, string(abi.encodePacked("Proposal not accepted by all beneficiaries. Please retrieve the allocation proposal to check the list of disagreeing beneficiaries.")));        
        }
        _;
    }

    event ReservoirLevelChange(uint indexed version, uint indexed waterLevel, uint indexed time);
    event NewAllocationSchemeProposed(uint waterAllocationProposalCurrentVersion, uint indexed votingStartTime, uint indexed votingEndTime, 
    address indexed proposedBy, address observedBy);
    event VoteForNewAllocationProposal(address indexed votedBy, uint votedAt);
    event VotingConcluded(uint indexed waterAllocationCurrentVersion, address mediatedBy, address observedBy, 
    uint proposedTime, uint indexed allocationTime);

    /*
     * Public functions
     */
    /// @dev Contract constructor sets initial beneficiaries, mediator, observer, the reservoir measurement unit and total capacity
    /// @param _beneficiaries List of countries/ states that would share the reservoir water.
    /// @param _mediator Organization/ country/ state that would facilitate the reservoir capacity sharing agremeent among the beneficiaries
    /// @param _observer Organizations/ entity that would engage in implementing the terms of the reservoir capacity sharing agreement
    constructor(address _owner, address[] memory _beneficiaries, address _mediator, address _observer, 
                string memory _reservoirCapacityUnit, uint _reservoirCapacity)  public 
                validRequirementUsers (_beneficiaries, _mediator, _observer)
                validRequirementOthers (_reservoirCapacityUnit, _reservoirCapacity) {

        owner = _owner;                    

        uint i;

        for(i=0; i<_beneficiaries.length; i++) {
            users[_beneficiaries[i]] = User({
                name: '',
                role: Role.Beneficiary,
                isActive: true,
                activeSince: block.timestamp
            });
        }

        users[_mediator] = User({
            name: '',
            role: Role.Mediator,
            isActive: true,
            activeSince: block.timestamp
        });

        users[_observer] = User({
            name: '', // Can be set later by a helper function
            role: Role.Observer,
            isActive: true,
            activeSince: block.timestamp
        });

        reservoirCapacityUnit = _reservoirCapacityUnit; 
        totalReservoirCapacity = _reservoirCapacity;  

        reservoirStateVersion = 0;
        waterAllocationCurrentVersion = 0;              
    }

    /// @dev Updates the reservoir water level.
    /// @param waterLevel Water level.
    /// @return isSuccess A boolean indicating whether or not the update operation succeeded.
    function updateReservoirWaterLevel(uint waterLevel) public validRequirementsUpdateWaterLevel(msg.sender, waterLevel) returns (bool isSuccess) {
        reservoirStateHistory[reservoirStateVersion] = ReservoirState ({
            waterLevel: waterLevel,
            observedBy: msg.sender,
            observedTime: block.timestamp
        });
        
        emit ReservoirLevelChange(reservoirStateVersion, reservoirStateHistory[reservoirStateVersion].waterLevel, reservoirStateHistory[reservoirStateVersion].observedTime);

        reservoirStateVersion = reservoirStateVersion + 1;

        isSuccess = true;
    }

    function retrieveReservoirWaterLevel() public view returns (uint version, uint waterLevel, address observedBy, uint observedTime) {
        require(reservoirStateVersion > 0, "Reservoir water level has not been updated so far.");
        version = reservoirStateVersion - 1;
        waterLevel = reservoirStateHistory[version].waterLevel;
        observedBy = reservoirStateHistory[version].observedBy;
        observedTime = reservoirStateHistory[version].observedTime;
    }

    /// @dev Proposes a new water allocation.
    /// @param beneficiaries List of beneficiaries.
    /// @param fractions List of water allocation fractions for each beneficiary in the same order as the beneficiaries list.
    /// @param votingStartTime Unix timestamp of when the voting can begin
    /// @param votingEndTime Unix timestamp of when the voting ends
    /// @return isSuccess A boolean indicating whether or not the update operation succeeded.
    function proposeNewAllocation(address[] memory beneficiaries, uint[] memory fractions, uint votingStartTime, uint votingEndTime, address observedBy) public 
    validRequirementsNewAllocations(beneficiaries, fractions, votingStartTime, votingEndTime, observedBy, msg.sender) returns (bool isSuccess) {         

        waterAllocationProposals[waterAllocationProposalCurrentVersion].beneficiaries = beneficiaries; 
        waterAllocationProposals[waterAllocationProposalCurrentVersion].fractions = fractions;     
        waterAllocationProposals[waterAllocationProposalCurrentVersion].mediatedBy = msg.sender;
        waterAllocationProposals[waterAllocationProposalCurrentVersion].observedBy = observedBy;
        waterAllocationProposals[waterAllocationProposalCurrentVersion].votingStartTime = votingStartTime;
        waterAllocationProposals[waterAllocationProposalCurrentVersion].votingEndTime = votingEndTime;
        waterAllocationProposals[waterAllocationProposalCurrentVersion].proposalAcceptedByBeneficiaries = false;                                        
        
        emit NewAllocationSchemeProposed(waterAllocationProposalCurrentVersion, votingStartTime, votingEndTime, msg.sender, observedBy);

        waterAllocationProposalCurrentVersion = waterAllocationProposalCurrentVersion + 1;

        isSuccess = true;
    }

    function retrieveAllocationProposal() public view returns 
    (uint proposalVersion, address[] memory beneficiaries, uint[] memory fractions, 
    uint votingStartTime, uint votingEndTime, address mediatedBy, address observedBy, bool[] memory votes, bool proposalAcceptedByBeneficiaries) {
        require(waterAllocationProposalCurrentVersion > 0, "No allocations proposed so far. Please come back here after an allocation plan is proposed.");

        proposalVersion = waterAllocationProposalCurrentVersion - 1;

        // We can try to avoid this storage allocation but without this, the code to reference the latest allocation proposal looks bit messy :(
        NewAllocationProposal storage latestAllocationProposal = waterAllocationProposals[proposalVersion];
        votes = new bool[](latestAllocationProposal.beneficiaries.length);
        
        beneficiaries = latestAllocationProposal.beneficiaries;
        fractions = latestAllocationProposal.fractions;     
        mediatedBy = latestAllocationProposal.mediatedBy;
        observedBy = latestAllocationProposal.observedBy;
        votingStartTime = latestAllocationProposal.votingStartTime;
        votingEndTime = latestAllocationProposal.votingEndTime; 

        for(uint i=0; i<latestAllocationProposal.beneficiaries.length; ++i) {
            votes[i] = latestAllocationProposal.votes[latestAllocationProposal.beneficiaries[i]];
        }

        proposalAcceptedByBeneficiaries = latestAllocationProposal.proposalAcceptedByBeneficiaries;
    }

    function retrieveCurrentTimestamp() public view returns (uint currentTimestamp) {
        currentTimestamp = block.timestamp;
    }

    function voteForNewAllocationProposal() public validRequirementsVoteForNewAllocation(msg.sender) returns (bool isSuccess) {
        waterAllocationProposals[waterAllocationProposalCurrentVersion - 1].votes[msg.sender] = true;
        emit VoteForNewAllocationProposal(msg.sender, block.timestamp);
        isSuccess = true;
    }

    function concludeVoting() public validRequirementsConcludeVoting(msg.sender) returns (bool isSuccess) {

        // We can try to avoid this storage allocation but without this, the code to reference the latest allocation proposal looks bit messy :(
        NewAllocationProposal storage latestAllocationProposal = waterAllocationProposals[waterAllocationProposalCurrentVersion - 1];

        for(uint i = 0; i < latestAllocationProposal.beneficiaries.length; ++i) {
            waterAllocationHistory[waterAllocationCurrentVersion].allocations[latestAllocationProposal.beneficiaries[i]] = latestAllocationProposal.fractions[i];            
        }
        
        waterAllocationHistory[waterAllocationCurrentVersion].beneficiaries = latestAllocationProposal.beneficiaries;
        waterAllocationHistory[waterAllocationCurrentVersion].mediatedBy = latestAllocationProposal.mediatedBy;
        waterAllocationHistory[waterAllocationCurrentVersion].observedBy = latestAllocationProposal.observedBy;
        waterAllocationHistory[waterAllocationCurrentVersion].proposedTime = latestAllocationProposal.votingStartTime;
        waterAllocationHistory[waterAllocationCurrentVersion].allocationTime = latestAllocationProposal.votingEndTime;        
        latestAllocationProposal.proposalAcceptedByBeneficiaries = true;
        
        emit VotingConcluded(waterAllocationCurrentVersion, waterAllocationHistory[waterAllocationCurrentVersion].mediatedBy, 
        waterAllocationHistory[waterAllocationCurrentVersion].observedBy, waterAllocationHistory[waterAllocationCurrentVersion].proposedTime, 
        waterAllocationHistory[waterAllocationCurrentVersion].allocationTime);

        waterAllocationCurrentVersion = waterAllocationCurrentVersion + 1;

        isSuccess = true;
    }

    function retrieveWaterAllocation() public view returns 
    (uint version, address[] memory beneficiaries, uint[] memory fractions, 
    uint proposedTime, uint allocationTime, address mediatedBy, address observedBy) {
        require(waterAllocationCurrentVersion > 0, "Allocations agreement unavailable at the moment. Please come back here after an allocation is proposed and voting concluded for the proposal.");

        version = waterAllocationCurrentVersion - 1;

        // We can try to avoid this storage allocation but without this, the code to reference the allocation plan looks bit messy :(
        WaterAllocation storage latestAllocationPlan = waterAllocationHistory[version];
                
        beneficiaries = latestAllocationPlan.beneficiaries;
        fractions = new uint[](latestAllocationPlan.beneficiaries.length);     
        mediatedBy = latestAllocationPlan.mediatedBy;
        observedBy = latestAllocationPlan.observedBy;
        proposedTime = latestAllocationPlan.proposedTime;
        allocationTime = latestAllocationPlan.allocationTime;  

        for(uint i=0; i<latestAllocationPlan.beneficiaries.length; ++i) {
            fractions[i] = latestAllocationPlan.allocations[latestAllocationPlan.beneficiaries[i]];
        }       
    }

}