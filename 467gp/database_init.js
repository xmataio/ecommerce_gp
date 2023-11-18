const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();


const db = new sqlite3.Database('database/mydatabase.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the database.');
    }
});
  


// Define an array of filenames containing SQL commands
const sqlFiles = ['sql/LegacyDatabase.sql', 'sql/InsertSampleValues.sql'];

// db.serialize ensures that each command inside of it is guarenteed to end before the next one starts
db.serialize(function() {
    // Loop through the array of filenames and execute the SQL commands in order
    sqlFiles.forEach((filename) => {
        const sql = fs.readFileSync(filename, 'utf8');
        db.exec(sql, (err) => {
            if (err) {
            console.error(err.message);
            } else {
            console.log(`Executed SQL commands from file: ${filename}`);
            }
        });
    });
});


db.serialize(() => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
      if (err) {
        console.error(err.message);
      } else {
        console.log('Tables:');
        tables.forEach((table) => {
          console.log(table.name);
        });
      }
    });
  });

// Close the database connection when finished
db.close();