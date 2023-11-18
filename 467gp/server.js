const express = require("express");
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const app = express();


const oneDay = 1000 * 60 * 60 * 24;
app.use(sessions({
    secret: "thisisasecretkey",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false 
}));

// Cookie parser middleware
app.use(cookieParser());

// Middleware in Express that parses form data from a POST request 
app.use(express.urlencoded({ extended: true }))

// Allow you to parse JSON info from body
app.use(express.json());


// Sets our view engine for express which is ejs.
app.set('view engine', 'ejs');

// Whenever a user sends a get request (loads up webpage) at index, we will render index.html
app.get("/", (req, res) => {
    let session = req.session;

    if(session.username) {
        res.render("index", {loggedOn: true, username: session.username, level: session.level});
    } else {
        res.render("index");
    }
});

app.get('/logout',(req,res) => {
    req.session.destroy();
    res.redirect('/');
});


// The enterQuote page
const enterQuoteRouter = require('./routes/enterSalesQuote');
app.use('/enterSalesQuote', enterQuoteRouter);

// Login page
const loginRouter = require('./routes/login');
app.use('/login', loginRouter);

// Admin associates page
const adminAssociatesRouter = require('./routes/adminAssociates');
app.use('/adminAssociates', adminAssociatesRouter);

// Admin quotes page
const adminQuotesRouter = require('./routes/adminQuotes');
app.use('/adminQuotes', adminQuotesRouter);

// Finalize quote page
const finalizeRouter = require('./routes/finalizeQuote');
app.use('/finalizeQuote', finalizeRouter);
  
// Processing order page
const processRouter = require('./routes/convertQuote');
app.use('/convertQuote', processRouter);

if (process.argv[2] && process.argv[2] === '-p') {
    console.log("-p flag given. Running http server")
    app.listen(80);
} else {
    console.log('Running on localhost:3000');
    app.listen(3000);
}
