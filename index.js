/**
 * This file is the main entry point of the application.
 * It sets up an Express server and connects to a PostgreSQL database
 * to handle CRUD operations for a to-do list.
 */

import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();
const password = process.env.PASSWORD;

// Create an Express app
const app = express();
const port = 3000;

// Connect to PostgreSQL database
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "permalist",
  password: `${password}`,
  port: 5432,
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    process.exit(1); // Exit the process with a non-zero status code
  }
  console.log("Connected to the database");
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Serve the index page
app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM items");
    const items = result.rows;

    // Formatting the current date
    const currentDate = new Date();
    const options = { weekday: "long", month: "long", day: "numeric" };
    const formattedDate = currentDate.toLocaleDateString("en-US", options);

    res.render("index.ejs", {
      listTitle: formattedDate,
      listItems: items,
    });
  } catch (err) {
    console.error("Error fetching items from the database:", err);
    res.status(500).send("An error occurred while fetching items");
  }
});

// Add a new item
app.post("/add", async (req, res) => {
  const item = req.body.newItem;

  try {
    if (!item) {
      return res.redirect("/?error=Please provide a task");
    }
    await db.query("INSERT INTO items (title) VALUES ($1)", [item]);
    res.redirect("/");
  } catch (err) {
    console.error("Error adding task:", err);
    res.redirect("/?error=An error occurred while adding a new task");
  }
});

// Edit an existing item
app.post("/edit", async (req, res) => {
  const newItem = req.body.updatedItemTitle;
  const itemId = req.body.updatedItemId;

  try {
    await db.query("UPDATE items SET title = $1 WHERE items.id = $2", [
      newItem,
      itemId,
    ]);
    res.redirect("/");
  } catch (err) {
    console.error("Error editing task:", err);
    res.redirect("/?error=An error occurred while editing a task");
  }
});

// Delete an item
app.post("/delete", async (req, res) => {
  const taskDoneId = req.body.deleteItemId;

  try {
    await db.query("DELETE FROM items WHERE items.id = $1", [taskDoneId]);
    res.redirect("/");
  } catch (err) {
    console.error("Error deleting task:", err);
    res.redirect("/?error=An error occurred while deleting a task");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("Gracefully shutting down the server...");
  db.end(() => {
    console.log("Disconnected from the database");
    process.exit(0);
  });
});
