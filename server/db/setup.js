require('dotenv').config()
const fs = require('fs')

const db = require("./connect")

const sql = fs.readFileSync("./server/db/schema.sql").toString()

//connect to db and run the script
db.query(sql)
    .then((data) => {
        db.end()
        console.log("Setup complete")
    })
    .catch ((error) => console.log(error))

