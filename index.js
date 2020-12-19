import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import userRouter from "./src/controllers/userController.js";
import galonRouter from "./src/controllers/galonController.js";

const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();

app.get("/", (req, res) => {
  res.send("Siti`s App - Galonku");
});

//default error
app.use((err, req, res) => {
  res.send(err.message);
});

app.use("/user", userRouter);
app.use("/galon", galonRouter);

app.listen(process.env.PORT, () => {
  console.log(`App listens to port ${process.env.PORT}`);
});

// Connect to DB
var uri = process.env.MONGODB_URI;
mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connect to DB success");
  })
  .catch((err) => {
    console.log("Connect to failed " + err);
  });