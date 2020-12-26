Design patterns in the protocol:-

1) Restricting Access
  • Water allocation proposal can only be created by valid mediator address
  • Votes can only be submitted by beneficiary addresses mentioned in the proposal
  • Voting can only be concluded by valid mediator address
  • Reservoir water level can only be updated by a valid observer address
  
2) State Machine
  • The current the water allocation proposal is archieved when concluded. The history of water allocation proposals can be retrieved based on proposal version number.
  • The current water allocation plan is archieved and new version created when currrent proposal is accepted. The history of water allocations can be retrieved based on version number.
  • The current reservoir water level is archieved when updated with new water level. The history can be retrieved based on version number


