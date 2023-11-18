/*
"finalized quotes can be retrieved, line items added, edited or removed, and prices
can be changed. A discount can be given either as percentage or amount. All line
items and the discount are computed into the final price quoted. The secret notes
added by the sales associate can be reviewed, and new ones added. The quotes
are updated in the quote database: either left unresolved, or sanctioned.
Sanctioned quotes are considered complete and sent out via e-mail to the
customer. The email contains all quote data except the secret notes"
*/

 //Path: routes\finalizeQuote.js
// Compare this snippet from routes\finalizeQuote.js:
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2');
let db = new sqlite3.Database('database/mydatabase.db');

const connection = mysql.createConnection({
    host: 'blitz.cs.niu.edu',
    user: 'student',
    password: 'student',
    database: 'csci467',
    port: '3306'
});

router.get("/", async (req, res) => {
    console.log("Finalize Quote");
    let session = req.session;
    if(!session.username){
        res.redirect('/');
    } else{
        const employee = await getLoggedEmployee(session);
        console.log(employee);

        let quotes = await grabQuotes(employee[0].employeeID);
        console.log(quotes);

        for(let i = 0; i < quotes.length; i++){
            quotes[i].price = await findPriceTotal(quotes[i].quoteID);
        }

        const editQuote = req.query.editQuoteID || "-1";
        const failureString = req.query.failure || "";
        const lineItems = await getLineItems(employee[0].employeeID);

        let customerNames = [];
        connection.query(
            'SELECT * FROM `customers`',
            function(err, results, fields){
                if(err){
                    console.error(err);
                    res.redirect('/');
                    return;
                }

                for(let i = 0; i < results.length; i++){
                    customerNames.push(results[i].name);
                }
                res.render("finalizeQuote", {loggedOn: true, username: session.username, employee: employee[0], quotes: quotes, customerNames: customerNames, lineItems: lineItems, editQuote: editQuote, failureString: failureString});
            }
        );

    }
});

router.post("/convert_quote", (req, res) => {
    console.log("Finalize Quote");
    const quoteID = req.body.quoteID;
    const customerID = req.body.customerID;
    const employeeID = req.body.employeeID;
    const customerEmail  = req.body.customerEmail;
    const paymentInfo = req.body.paymentInfo;
    const price = req.body.price;
    const description = req.body.description;
    const status = "Sanctioned";

    console.log("BODY")
    console.log(req.body);

    let query = `UPDATE quote SET customerID = "${customerID}", employeeID = "${employeeID}", customerEmail = "${customerEmail}", paymentInfo = "${paymentInfo}", price = "${price}", description = "${description}", status = "${status}" WHERE quoteID = "${quoteID}"`;
    db.all(query, (err, rows) => {
        if (err) {
            console.log(err);
        }
        else { res.redirect('/convertQuote'); }
    });
});

router.post("/insert_line_item", (req, res) => {
    const quoteID = req.body.quoteID;
    const price = req.body.newLinePrice;
    const description = req.body.newLineDescription;

    console.log("QUOTE ID: " + quoteID)
    console.log("PRICE: " + price);
    console.log("DESCRIPTION: " + description);

    db.run(`INSERT INTO lineItems (quoteID, price, description) VALUES ("${quoteID}", "${price}", "${description}")`, (err) => {
        if (err) {
            console.log(err);
            res.redirect("/");
        } else {
            res.redirect("/finalizeQuote?editQuoteID=" + quoteID);
        }
    });
});

router.post("/remove_line_item", (req, res) => {
    console.log(req.body)
    const quoteID = req.body.quoteID;
    const lineItemID = req.body.lineItemID;
    const price = req.body["lineItem" + lineItemID - 1];
    const description = req.body.newLineDescription;

    console.log("QUOTE ID: " + quoteID)
    console.log("PRICE: " + price);
    console.log("DESCRIPTION: " + description);

    db.run(`REMOVE FROM lineItems WHERE quoteID = "${quoteID}" AND price = "${price}" AND description = "${description}")`, (err) => {
        if (err) {
            console.log(err);
            res.redirect("/");
        } else {
            res.redirect("/finalizeQuote?editQuoteID=" + quoteID);
        }
    });
});

//allow employees to update sales quotes
router.post("/update_quote", (req, res) => {
    const quoteID = req.body.quoteID;
    const customerEmail = req.body.customerEmail || "";
    const description = req.body.description || "";
    const discount = req.body.discount || 0;

    if(!ValidateEmail(customerEmail)) {
        console.log("Invalid email");
        res.redirect(`/finalizeQuote?editQuoteID=${quoteID}&failure=invalidEmail`);
        return;
    }

    if(!ValidateNumber(discount)) {
        console.log("Invalid discount");
        res.redirect(`/finalizeQuote?editQuoteID=${quoteID}&failure=invalidDiscount`);
        return;
    }

    //const lineItemProperties = Object.keys(req.body).filter(prop => prop.startsWith('lineItem'));
    const itemPriceProperties = Object.keys(req.body).filter(prop => prop.startsWith('itemPrice'));

    //console.log(lineItemProperties);
    console.log(itemPriceProperties);

    let total = 0;

    for(let x = 0; x < itemPriceProperties.length; x++) {
        //const lineItem = req.body[lineItemProperties[x]];
        const linePrice = req.body[itemPriceProperties[x]];

        total += parseInt(linePrice);
    }

    db.run(`UPDATE quote SET description = "${description}", price = "${total}", customerEmail = "${customerEmail}", discount="${discount}" WHERE quoteID = "${quoteID}"`, (err) => {
        if (err) {
            console.log(err);
            res.redirect("/");
        } else {
            res.redirect("/finalizeQuote");
        }
    });
});

router.get('/logout',(req,res) => {
    req.session.destroy();
    res.redirect('/');
});

function ValidateEmail(email) 
{

    if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
        return true;
    }
    return false;
}

// Validates that numeric values are entered
function ValidateNumber(number) {
    return /^\d+$/.test(number);
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

async function grabQuotes(employeeID) {
    console.log(employeeID)
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM quote WHERE employeeID = '${employeeID}' AND status = 'Finalized'`, (err, rows) => {
            if(err){
                reject(err);
            }else{
                resolve(rows);
            }
        });
    });
}

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

module.exports = router;