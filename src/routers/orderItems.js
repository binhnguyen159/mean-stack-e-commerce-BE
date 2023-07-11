const express = require("express");
const OrderItem = require("../models/orderItem");

const router = express.Router();

router.get("/", async (req, res, next) => {
  const orderItems = await OrderItem.find();
  res.status(200).json(orderItems);
})

module.exports= router;