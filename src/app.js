const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const productRouter = require("./routers/products");
const orderRouter = require("./routers/orders");
const userRouter = require("./routers/users");
const orderItemRouter = require("./routers/orderItems");
const categoryRouter = require("./routers/categories");
const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/error-handler");
require("dotenv/config");

const app = express();

const api = process.env.API_URL;

app.use(cors());
app.options("*", cors());

// Middleware
app.use(express.json());
app.use(morgan("tiny"));
app.use(authJwt());
app.use('/public/uploads', express.static('public/uploads'));
app.use(errorHandler);

app.use(`${api}/products`, productRouter);
app.use(`${api}/orders`, orderRouter);
app.use(`${api}/users`, userRouter);
app.use(`${api}/orderItems`, orderItemRouter);
app.use(`${api}/categories`, categoryRouter);

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "eshop",
  })
  .then(() => {
    console.log("Database connection is ready...");
  })
  .catch((err) => {
    console.log("Connect DB:", err, "!!!");
  });

app.listen(process.env.PORT, () => {
  console.log(`Server is running http://localhost:${process.env.PORT}`);
});
