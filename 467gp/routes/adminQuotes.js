const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2');

// Open database
let db = new sqlite3.Database('database/mydatabase.db');

async function getEmployees() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM employee WHERE isAdmin = 0`, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

router.get("/", async (req, res) => {
    console.log("Admin");
    let session = req.session;
    if(!session.username || session.level != 'admin') {
        res.redirect('/');
    } else {
        try {

            const connection = mysql.createConnection({
                host: 'blitz.cs.niu.edu',
                user: 'student',
                password: 'student',
                database: 'csci467',
                port: '3306'
            });

            const associates = await getEmployees();
            const startDate = req.query.startDate || "2018-01-01";
            const endDate = req.query.endDate || new Date().toISOString().slice(0, 10);
            const status = req.query.status || "all";
            const selectedAssociate = req.query.associate || "all";
            const selectedCustomer = req.query.customer || "all";

            let quotes = await getQuotes(startDate, endDate, status, selectedAssociate, selectedCustomer);

            console.log(quotes)
        
            connection.query(
            'SELECT * FROM `customers`',
            function(err, results, fields) {
                if(err) {
                    console.error(err);
                    res.redirect('/');
                    return;
                }
    
                res.render("adminQuotes", {loggedOn: true, username: session.username, associates: associates, customers: results, startDate: startDate, endDate: endDate, status: status, selectedAssociate: selectedAssociate, selectedCustomer: selectedCustomer, quotes: quotes});
            });

        } catch(error) {
            console.log(error);
            res.status(500).send("Internal Server Error");
        }
        
    }
});


function getQuotes(startDate, endDate, status, employeeID, customerID) {
    return new Promise((resolve, reject) => {
        let sql = 'SELECT * FROM quote';

        if (startDate !== 'all' && endDate !== 'all') {
            sql += ` WHERE dateCreated BETWEEN '${startDate}' AND '${endDate}'`;
        }

        if (status !== 'all') {
            if (sql.includes('WHERE')) {
                sql += ` AND status='${status}'`;
            } else {
                sql += ` WHERE status='${status}'`;
            }
        }

        if (employeeID !== 'all') {
            if (sql.includes('WHERE')) {
                sql += ` AND employeeID='${employeeID}'`;
            } else {
                sql += ` WHERE employeeID='${employeeID}'`;
            }
        }

        if (customerID !== 'all') {
            if (sql.includes('WHERE')) {
                sql += ` AND customerID='${customerID}'`;
            } else {
                sql += ` WHERE customerID='${customerID}'`;
            }
        }

        //console.log(sql);
        db.all(sql, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}





module.exports = router;

