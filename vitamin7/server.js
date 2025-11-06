// LIBRARIES NEEDED
const express = require("express");
const app = express();
const mysql = require("mysql2");
const mongoose = require("mongoose");
require("dotenv").config();

app.use(express.json());

// ---------- SQL CONNECTION ----------
const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST || "localhost",
  database: process.env.MYSQL_DB || "company_db",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD, // set in .env
  port: Number(process.env.MYSQL_PORT) || 3306,
});

// MySQL Connection Verification
function verifyMySQLConnection() {
  connection.connect(function (err) {
    if (err) {
      console.error("Error connecting to MySQL: " + err.stack);
      return;
    }
    console.log("MySQL connected as id " + connection.threadId);
  });
}

// ---------- MONGOOSE CONNECTION ----------
mongoose.connect(
  process.env.MONGO_URI || "mongodb://localhost:27017/companyDB",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// ---------- Mongoose Schema and Model ----------
const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  budget: { type: Number, required: true },
});
const ProjectModel = mongoose.model("Project", ProjectSchema);

// MongoDB Connection Verification
mongoose.connection.on("connected", () => {
  console.log("MongoDB connected successfully");
});
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

// ---------- ENDPOINTS ----------
// http://localhost:3000/projects
app.get("/projects", async (req, res) => {
  try {
    const projects = await ProjectModel.find({});
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

// http://localhost:3000/employees
app.get("/employees", function (req, res) {
  connection.query("SELECT * FROM employees", function (error, results) {
    if (error) {
      console.error(error);
      return res.status(500).send(error);
    }
    res.json(results);
  });
});

// ---------- RUN SERVER ----------
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, function () {
  console.log(`Server is running on port ${PORT}!`);
  verifyMySQLConnection();
});
