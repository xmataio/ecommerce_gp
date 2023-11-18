const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2');

// Open database
let db = new sqlite3.Database('database/mydatabase.db');

const connection = mysql.createConnection({
    host: 'blitz.cs.niu.edu',
    user: 'student',
    password: 'student',
    database: 'csci467',
    port: '3306'
});

//allow employees to enter sales quotes
router.get("/", async (req, res) => {
    console.log("Enter Sales Quote");
    let session = req.session;
    if(!session.username) {
        res.redirect('/');
    } else {
        
        const employee = await getLoggedEmployee(session);

        const quotes = await getQuotes(employee[0].employeeID);

        const lineItems = await getLineItems();

        const editQuote = req.query.editQuoteID || "-1";

        const failureString = req.query.failure || "";

        let customerNames = [];
        connection.query(
        'SELECT * FROM `customers`',
        function(err, results, fields) {
            if(err) {
                console.error(err);
                res.redirect('/');
                return;
            }

            for(let i = 0; i < results.length; i++) {
                customerNames.push(results[i].name);
            }


            res.render("enterQuote", {loggedOn: true, username: session.username, customers: results, customerNames: customerNames, employee: employee[0], quotes: quotes, lineItems: lineItems, editQuote: editQuote, failureString: failureString});
        });
    }
});


//allow employees to enter sales quotes
router.post("/enter_quote", (req, res) => {
    const customerName = req.body.customerName;
    const employeeID = req.body.employeeID;
    const customerEmail = req.body.customerEmail;
    const paymentInfo = req.body.customerPaymentInfo;
    const description = req.body.description;

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is zero-indexed, so we add 1 and pad with '0'
    const day = String(currentDate.getDate()).padStart(2, '0'); // Pad with '0' if needed

    const formattedDate = `${year}-${month}-${day}`;


    connection.query(
        `SELECT * FROM \`customers\` WHERE \`name\` = '${customerName}'`,
        function(err, results, fields) {
            if(err) {
                console.error(err);
                res.redirect('/');
                return;
            }


            db.run(`INSERT INTO quote (customerID, employeeID, customerEmail, paymentInfo, description, dateCreated) VALUES ("${results[0].id}", "${employeeID}", "${customerEmail}", "${paymentInfo}", "${description}", "${formattedDate}")`, (err) => {
                if (err) {
                    console.log(err);
                    res.redirect("/");
                } else {
                    res.redirect("/enterSalesQuote");
                }
            });
        }
    );

});


//allow employees to update sales quotes
router.post("/update_quote", (req, res) => {
    const quoteID = req.body.quoteID;
    const customerEmail = req.body.customerEmail || "";
    const description = req.body.description || "";
    const discount = req.body.discount || 0;

    if(!ValidateEmail(customerEmail)) {
        console.log("Invalid email");
        res.redirect(`/enterSalesQuote?editQuoteID=${quoteID}&failure=invalidEmail`);
        return;
    }

    if(!ValidateNumber(discount)) {
        console.log("Invalid discount");
        res.redirect(`/enterSalesQuote?editQuoteID=${quoteID}&failure=invalidDiscount`);
        return;
    }

    console.log("DISCOUNT TYPE")
    console.log(typeof discount)

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
            res.redirect("/enterSalesQuote");
        }
    });

    

});

//allow employees to enter sales quotes
router.post("/finalize_quote", (req, res) => {
    console.log("FINALIZE")
    const customerName = req.body.customerName;
    const employeeID = req.body.employeeID;
    const quoteID = req.body.quoteID;
    const customerEmail = req.body.customerEmail;
    const paymentInfo = req.body.customerPaymentInfo;
    const price = req.body.price;
    const description = req.body.description;
    const status = "Finalized";
    

    console.log("BODY")
    console.log(req.body);

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is zero-indexed, so we add 1 and pad with '0'
    const day = String(currentDate.getDate()).padStart(2, '0'); // Pad with '0' if needed

    const formattedDate = `${year}-${month}-${day}`;

    connection.query(
        `SELECT * FROM \`customers\` WHERE \`name\` = '${customerName}'`,
        function(err, results, fields) {
            if(err || results.length == 0) {
                console.error(err);
                res.redirect('/');
                return;
            }

            let query = `UPDATE quote SET customerEmail = "${customerEmail}", paymentInfo = "${paymentInfo}", price = "${price}", description = "${description}", status = "${status}" WHERE quoteID = "${quoteID}"`;
            db.all(query, (err, rows) => {
                if (err) {
                    console.log(err);
                }
                else { res.redirect('/finalizeQuote'); }
            });
        }
    );
});

router.post("/insert_line_item", (req, res) => {
    const quoteID = req.body.quoteID;
    const price = req.body.newLinePrice;
    const description = req.body.newLineDescription;

    console.log(req.body)

    console.log("QUOTE ID: " + quoteID)
    console.log("PRICE: " + price);
    console.log("DESCRIPTION: " + description);

    db.run(`INSERT INTO lineItems (quoteID, price, description) VALUES ("${quoteID}", "${price}", "${description}")`, (err) => {
        if (err) {
            console.log(err);
            res.redirect("/");
        } else {
            res.redirect("/enterSalesQuote?editQuoteID=" + quoteID);
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
            res.redirect("/enterSalesQuote?editQuoteID=" + quoteID);
        }
    });

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

async function getQuotes(employeeID) {
    console.log(employeeID)
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM quote WHERE employeeID = '${employeeID}' AND status = 'unresolved'`, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = router;