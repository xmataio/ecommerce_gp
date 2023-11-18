const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

// Open database
let db = new sqlite3.Database('database/mydatabase.db');

router.get("/", (req, res) => {
    console.log("Login");
    res.render("login");
});

router.post("/", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    checkValidEmployee(username, password).then(isValid => {
        if(isValid) { // Valid employee login
            let session=req.session;
            session.username = req.body.username;
            session.level = 'employee';
            res.redirect('/');
        } else {
            checkValidAdmin(username, password).then(isValid => {
                if(isValid) { // Valid admin login
                    let session = req.session;
                    session.username = req.body.username;
                    session.level = 'admin';
                    res.redirect('/');
                } else { // Invalid; not an employee or admin
                    res.render("login", {warning: "Invalid username or password!", username: username, password: password});
                }
            })
        }
    })
})

// Checks if employee exists in our database with matching username and password
// Note: This is not a secure method of doing this.
function checkValidEmployee(username, password) {
    // We return a promise here since db.get is async
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM employee WHERE username = "${username}" AND password = "${password}" AND isAdmin = 0`, (err, row)=>{
            if (err) {
                return reject(err);
            }

            if(row) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });

}

//build a function to check admin login
function checkValidAdmin(username, password) {
    // We return a promise here since db.get is async
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM employee WHERE username = "${username}" AND password = "${password}" AND isAdmin = 1`, (err, row)=>{
            if (err) {
                return reject(err);
            }

            if(row) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

module.exports = router;