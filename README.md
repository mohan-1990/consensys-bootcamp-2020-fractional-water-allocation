# consensys-bootcamp-2020-fractional-water-allocation-protocol

Fractional water allocation contract
-----------------------------------------------------

Video demo of the project
-----------------------------------------------------
https://www.youtube.com/watch?v=-76dmkNzT8E&feature=youtu.be

Project background:-
-----------------------------------------------------

The project work is based on this educational youtube video https://www.youtube.com/watch?v=_BCY0SPOFpE&t=796s.

Problem scenario:-
-----------------------------------------------------
Conflict among a group of neighbouring countries on sharing water from a reservoir.

Possible solution:-
-----------------------------------------------------
Fractional water allocation and reservoir capacity sharing concepts (For reference take a look at this paper:- https://www.sciencedirect.com/science/article/pii/S1474706507001222)

Project Scope:-
-----------------------------------------------------

The project is an attempt to implement (a subset of) fractional water allocation protocol on ethereum blockchain. 
The scope is limited to simulation of water allocation proposal and voting process.

Main Actors:-
-----------------------------------------------------

1) Beneficiaries - A countries, states or cities that have rights to utilize the reservoir water
2) Mediator - A recongnized organization that could facilitate talks among the beneficiaries and propose water allocation plan
3) Observer - A recognized organization that attests the allocation plan. Additionally the observer can attest the changes in the reservoir water level.
4) Admin - An IT organization that helps initialize the contract on ethereum blockchain
5) Public - Anyone with an ethereum address can view the allocation plan, proposal and reservoir water level.

Steps in Protocol:-
-----------------------------------------------------

1) Admin fills in details of beneficiaries, mediator, observer and other reservoir details and initialize the contract on ethereum blockchain
2) Mediator proposes an allocation percentage for each beneficiary and sets the voting window
3) During the voting window, the beneficiaries can retrieve the allocation plan and vote if they agree to the proposal
4) After the voting window, the mediator needs to conclude the voting. If all beneficiaries voted the new allocation plan is adopted
5) If not all beneficiaries voted in favour of the allocation plan, the mediator begins from Step 2 at a later point in time

Project Strech:-
-----------------------------------------------------

1) Feature improvements to Fractional Water Allocation Protocol:-

The current version retrieve only the latest reservoir water level, allocation proposals and allocation plans. I wish to imrpove the contract to retrieve the full history and display as an interactive histogram on the app interface.

2) Surplus Water Trade Protocol Implementation:-

The reference paper (https://www.sciencedirect.com/science/article/pii/S1474706507001222) also talks about protocol to trade surplus water. 
For example, one beneficiary wishes to trade water from their allocated capacity with some other beneficiary for a specified amount of time.
I think ERC20 token is a possible candidate to implement this protocol. But due to limited time availability I wish to keep this idea for future implementation.

----------------------------------------------------------------------------------------------------------------------------------------------------------------

Steps to run the project:-
-----------------------------------------------------

1) Install Ganache - https://www.trufflesuite.com/ganache
2) Start Ganache
3) Install nodejs - https://nodejs.org/en/download/
4) cd app_server
5) npm install
6) npm start
7) Open http://localhost:3000/welcome







