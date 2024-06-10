import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();
const password = process.env.PASSWORD;

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "permalist",
  password: `${password}`,
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
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
});

app.post("/add", async (req, res) => {
  const item = req.body.newItem;

  try {
    if (!item) {
      return res.redirect("/?error=Please provide a task");
    }
    await db.query("INSERT INTO items (title) VALUES ($1)", [item]);
  } catch (err) {
    console.error("Error adding task:", err);
    res.redirect("/?error=An error occurred while adding a new task");
  }

  res.redirect("/");
});

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

app.post("/delete", async (req, res) => {
  const taskDoneId = req.body.deleteItemId;
  try {
    await db.query("DELETE FROM items WHERE items.id = $1", [taskDoneId]);
    res.redirect("/");
  } catch (err) {
    console.log("Error trying to delete a task: ", err);
    res.redirect("/?error=An error occurred while deliting a task");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
