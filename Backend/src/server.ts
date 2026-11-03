import dotenv from "dotenv";
import app from "./app";
import { db } from "./config/db";

dotenv.config();

const PORT = process.env.PORT || 5000;

async function testDb() {
  try {
    const connection = await db.getConnection();

    console.log("MySQL Connected");

    connection.release();
  } catch (error) {
    console.error("MySQL Error", error);
  }
}

testDb();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
