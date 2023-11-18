/*
"The third interface (also in-house) allows to convert a quote into a purchase order
once the customer has indicated to go ahead with the order (the go ahead is
given outside of the scope of this system, e.g. via phone or snail mail). At this
time an additional final discount can be entered. The final amount is computed.
The purchase order is then sent to an external processing system (details
provided later) which answers with a processing date and sales commission rate
for the sales associate. The commission is computed and recorded for the quote
and in the sales associates accumulated commission. An email is sent to the
customer with all the purchase details, including the processing date."
*/

// Path: routes\convertQuote.js
// Compare this snippet from routes\convertQuote.js:
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2');
var nodemailer = require('nodemailer');

// Open database
let db = new sqlite3.Database('database/mydatabase.db');

router.get("/", async (req, res) => {
    console.log("Convert Quote");
    let session = req.session;
    if(!session.username){
        res.redirect('/');
    } else{
        const employee = await getLoggedEmployee(session);
        console.log(employee);

        let quotes = await takeQuotes(employee[0].employeeID);
        console.log(quotes);

        const lineItems = await getLineItems();
        console.log(lineItems);

        for(let i = 0; i < quotes.length; i++){
            quotes[i].price = await findPriceTotal(quotes[i].quoteID);
        }

        res.render("convertQuote", {loggedOn: true, username: session.username, employee: employee[0], quotes: quotes});
    }
});

router.post("/convertQuote", (req, res) => {
    console.log("Convert Quote");
    const quoteID = req.body.quoteID;
    const customerID = req.body.customerID;
    const employeeID = req.body.employeeID;
    const customerEmail  = req.body.customerEmail;
    const paymentInfo = req.body.paymentInfo;
    const price = req.body.price;
    const description = req.body.description;
    const status = ordered;

    let query = `UPDATE quote SET customerID = "${customerID}", employeeID = "${employeeID}", customerEmail = "${customerEmail}", paymentInfo = "${paymentInfo}", price = "${price}", description = "${description}", status = "${status}" WHERE quoteID = "${quoteID}"`;
    db.all(query, (err, rows) => {
        if (err) {
            console.log(err);
        }
        res.render("convertQuote", {rows: rows});
    });

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
        user: 'plantrepairservices24@gmail.com',
        pass: 'Plantrepair24'
        }
    });
    
    var mailOptions = {
        from: 'plantrepairservices24@gmail.com',
        to: 'myfriend@yahoo.com',
        subject: 'Your Quote Has Been Purchased!',
        text: 'Thank you for choosing Plant Reapair Services!'
    };
    
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
        console.log(error);
        } else {
        console.log('Email sent: ' + info.response);
        }
    });
});

router.get('/logout',(req,res) => {
    req.session.destroy();
    res.redirect('/');
});

async function getLoggedEmployee(session) {
    console.log(session.username)
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM employee WHERE isAdmin = 0 AND username = '${session.username}'`, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

async function getLineItems() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM lineItems`, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

async function takeQuotes(employeeID) {
    console.log(employeeID)
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM quote WHERE employeeID = '${employeeID}' AND status = 'Sanctioned'`, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Find price total (not including discount)
async function findPriceTotal(quoteID) {
    return new Promise((resolve, reject) => {
        let totalAmt = 0;
        db.all(`SELECT * FROM lineItems WHERE quoteID = '${quoteID}'`, (err, rows) => {
            if(err){
                reject(err);
            }else{
                for(let i = 0; i < rows.length; i++){
                    totalAmt += rows[i].price;
                }
                resolve(totalAmt);
            }
        });
    });
}

module.exports = router;