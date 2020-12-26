const express = require('express');
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser');
const path = require('path');
const fwacmiddleware = require('./fractionalWaterAllocationMiddleware');
const app = express()
const port = 3000

fwacmiddleware.init();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(cookieParser());

app.use(bodyParser.json());

app.get('/', (req, res) => res.send('Fractional Water Allocation & Reservoir Operations Demo!'));


app.get('/welcome',function(req,res) {
    res.sendFile(path.join(__dirname, 'static/welcome.html'));
});

app.post('/loginhdlr',function(req,res) {
    let usrName = req.body.usrName;
    let addr = req.body.addr;

    res.cookie('usrName', usrName);
    res.cookie('addr', addr);

    if (usrName === "admin") {

        fwacmiddleware.getAvailableAccounts().then(function(accounts) {
            if(addr == accounts[0]) {
                res.sendFile(path.join(__dirname, 'static/admin.html'));
            }
        });
        
    }
    else if (usrName === "public") {

        fwacmiddleware.getAvailableAccounts().then(function(accounts) {
            if(accounts.includes(addr)) {
                res.sendFile(path.join(__dirname, 'static/public.html'));
            }
        });
        
    }
    else {

        fwacmiddleware.contractInstanceConstants().then(function(constants) {
            if (constants['beneficiaries'].includes(addr)) {
                res.sendFile(path.join(__dirname, 'static/beneficiary.html'));
            } 
            else if (constants['mediatedBy'] == addr) {
                res.sendFile(path.join(__dirname, 'static/mediator.html'));
            } 
            else if (constants['observedBy'] == addr) {
                res.sendFile(path.join(__dirname, 'static/observer.html'));
            }   
            else {
                res.send("Invalid credentials");
            }         
        });

    }    
       
});

app.post('/initfwac', function(req, res) {    

    const beneficiaries = req.body.beneficiaries;
    const mediatedBy = req.body.mediatedBy;
    const observedBy = req.body.observedBy;
    const reservoirCapacityUnit = req.body.reservoirCapacityUnit;
    const reservoirCapacity = parseInt(req.body.reservoirCapacity);

    console.log("Request /initfwac: " + JSON.stringify(req.body));

    fwacmiddleware.getAvailableAccounts().then(function(accounts) {
        fwacmiddleware.initContract(accounts[0], beneficiaries, mediatedBy, observedBy, reservoirCapacityUnit, reservoirCapacity).then(function(result) { 
            console.log("Response /initfwac: " + JSON.stringify(result));
            res.set('Content-Type', 'application/json');           
            res.status(200).send(result);
        }).catch(function(exception) {
            res.status(500).send(exception);
        });
    });    

});

app.post('/proposeallocation', function(req, res) {    

    const beneficiaries = req.body.beneficiaries;
    const fractions = req.body.fractions;
    const mediatedBy = req.body.mediatedBy;
    const observedBy = req.body.observedBy;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;

    fwacmiddleware.proposeAllocation(beneficiaries, fractions, startTime, endTime, observedBy, mediatedBy).then(function(result) {     
        res.set('Content-Type', 'application/json');   
        res.status(200).send(result);
    }).catch(function(exception) {
        res.status(500).send(exception);
    });    
});

app.post('/voteforallocation', function(req, res) {    

    const fromAccount = req.body.fromAccount;

    fwacmiddleware.voteForAllocationProposal(fromAccount).then(function(result) { 
        res.set('Content-Type', 'application/json');       
        res.status(200).send(result);
    }).catch(function(exception) {
        res.status(500).send(exception);
    });    
});

app.post('/concludevoting', function(req, res) {    

    const fromAccount = req.body.fromAccount;

    fwacmiddleware.concludeVoting(fromAccount).then(function(result) {   
        res.set('Content-Type', 'application/json');     
        res.status(200).send(result);
    }).catch(function(exception) {
        res.status(500).send(exception);
    });    
});

app.post('/retrieveallocationproposal', function(req, res) {    

    const fromAccount = req.body.fromAccount;

    fwacmiddleware.retrieveAllocationProposal(fromAccount).then(function(result) {   
        res.set('Content-Type', 'application/json');     
        res.status(200).send(result);
    }).catch(function(exception) {
        res.status(500).send(exception);
    });    
});

app.post('/retrieveallocationplan', function(req, res) {    

    const fromAccount = req.body.fromAccount;

    fwacmiddleware.retrieveAllocationPlan(fromAccount).then(function(result) {     
        res.set('Content-Type', 'application/json');   
        res.status(200).send(result);
    }).catch(function(exception) {
        res.status(500).send(exception);
    });    
});

app.post('/retrievereservoirlevel', function(req, res) {    

    const fromAccount = req.body.fromAccount;

    console.log("Request /retrievereservoirlevel: " + JSON.stringify(req.body));

    fwacmiddleware.retrieveReservoirWaterLevel(fromAccount).then(function(result) {     
        res.set('Content-Type', 'application/json');  
        console.log("Response /retrievereservoirlevel: " + result); 
        res.status(200).send(result);
    }).catch(function(exception) {
        console.log("Exception /retrievereservoirlevel: " + exception);
        res.status(500).send(exception);
    });    
});

app.post('/updatereservoirlevel', function(req, res) {    

    const fromAccount = req.body.fromAccount;
    const waterLevel = req.body.waterLevel;

    fwacmiddleware.updateReservoirWaterLevel(waterLevel, fromAccount).then(function(result) {     
        res.set('Content-Type', 'application/json');   
        res.status(200).send(result);
    }).catch(function(exception) {
        res.status(500).send(exception);
    });    
});

app.post('/retrievecurrenttimestamp', function(req, res) {    

    const fromAccount = req.body.fromAccount;

    fwacmiddleware.retrieveCurrentTimestamp(fromAccount).then(function(result) {   
        res.set('Content-Type', 'application/json');     
        res.status(200).send(result);
    }).catch(function(exception) {
        res.status(500).send(exception);
    });    
});

app.listen(port, () => console.log(`FWAC app server listening on port ${port}!`))