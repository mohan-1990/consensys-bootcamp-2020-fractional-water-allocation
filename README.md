# consensys-bootcamp-2020-fractional-water-allocation

Video demo of the project
-----------------------------------------------------
https://www.youtube.com/watch?v=-76dmkNzT8E&feature=youtu.be

Fractional water allocation contract

Project background:-

My project work is based on this youtube video https://www.youtube.com/watch?v=_BCY0SPOFpE&t=796s.

Problem scenario:- Conflict among a group of neighbouring countries on sharing water from a reservoir
Possible solution:- Fractional water allocation and reservoir capacity sharing concepts (For reference take a look at this paper:- https://www.sciencedirect.com/science/article/pii/S1474706507001222)

Project Scope:-

My project is an attempt to implement fractional water allocation protocol on ethereum blockchain. 
The scope is only limited to simulation of water allocation proposal and voting process.

Main Actors:-

1) Beneficiaries - A countries or a states that has rights to utilize the reservoir water
2) Mediator - A recongnized organization that could facilitate talks among the nations and propose water allocation percentage
3) Observer - A recognized organization that attests the allocation protocol. Additionally the observer can attest the changes in the reservoir water level.
4) Admin - An IT organization that helps initialize the contract on ethereum blockchain
5) Public - Anyone with an ethereum address can view the allocation plan, proposal and reservoir water level.

Protocol:-

Step 1) Admin fills in details of beneficiaries, mediator, observer and other reservoir details and initialize the contract on ethereum blockchain.
Step 2) Mediator proposes an allocation percentage for each beneficiary and sets the voting window.
Step 3) During the voting window, the beneficiaries can retrieve the allocation plan and vote if they agree to the proposal.
Step 4) After the voting window, the mediator needs to conclude the voting. If all beneficiaries voted the new allocation plan is adopted.
Step 5) If not all beneficiaries voted in favour of the allocation plan, the protocol begins from Step 2.

Project Strech:-
The reference paper (https://www.sciencedirect.com/science/article/pii/S1474706507001222) talks about protocol to trade surplus water. 
For example, one beneficiary wishes to trade water from their allocated capacity to some other beneficiary for a specified amount of time.
I think ERC20 token is a possible candidate to implement this protocol. But due to limited time availability I wish to keep this idea for future implementation.

----------------------------------------------------------------------------------------------------------------------------------------------------------------

How to run the project?

1) Install Ganache - https://www.trufflesuite.com/ganache
2) Install nodejs - https://nodejs.org/en/download/
3) cd app_server
4) npm install
5) npm start
6) Open http://localhost:3000/welcome







