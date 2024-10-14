require('dotenv').config();
const express = require('express');
const app = express();
const { open } = require('sqlite');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3');
const cors = require("cors");
app.use(cors());
const path = require('path');
app.use(express.json());

let db = null;
const dbpath = path.join(__dirname, 'database.db');

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log('Server is running on port 3000');
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  try {
    const loginQuery = 'SELECT * FROM agent WHERE username = ?';
    const dbresponse = await db.get(loginQuery, [username]);

    if (dbresponse === undefined) {
      return response.status(400).json({ error: "Invalid user" });
    }

    if (password !== dbresponse.password) {
      return response.status(401).json({ error: "Invalid password" });
    }


    const user = { name: username, auth: "user" , tokenmode: "notadmin"};
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN);
    console.log('Login successful, sending token');
    return response.status(200).json({ accessToken });

  } catch (e) {
    console.error(e);
    return response.status(500).send("Server Error!");
  }
});

app.post("/register", async (request, response) => {
  const { username, password } = request.body;

  try {
    const loginQuery = `SELECT * FROM users WHERE username = '${username}'`;
    const dbresponse = await db.get(loginQuery);
    console.log(dbresponse)

    if (dbresponse !== undefined) {
      return response.status(400).json({ error: "User Already Registered" });
    }
    else{

    if (password.length < 6) {
      return response.status(400).json({ error: "Password must be greater than six characters" });
    }
    const user = { name: username };
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN);
    const registerQuery = `INSERT INTO users (username, password) VALUES ('${username}', '${password}')`;
    await db.run(registerQuery);
    return response.status(200).json({ accessToken });

  }
 } catch (e) {
    console.error(e);
    return response.status(500).send("Server Error!");
  }
});


app.get("/users",async (request,response)=>{
  const getDataQuery = `
  SELECT *
  FROM 
  users
  `
  const responseQuery = await db.all(getDataQuery)
  response.send(responseQuery)
})


