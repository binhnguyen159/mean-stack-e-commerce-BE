const express = require("express");
const Order = require("../models/order");
const OrderItem = require("../models/orderItem");
const mongoose = require("mongoose");
const Product = require("../models/product");
const stripe = require("stripe")(
  "sk_test_51NSWrjHMXZU8CGVP6PdxFAcyhfiApQChLRXmPi8i1kvr0PskdKbyOcdWABWMkAGacpgjhEKy7CvBy6vUJ2hM8fQK00zjEVtDZC"
);
const router = express.Router();

router.get("/", async (req, res, next) => {
  const orders = await Order.find()
    .populate("user", "name")
    .sort({ dateOrdered: -1 });
  return res.status(200).json(orders);
});

router.get("/count", async (req, res, next) => {
  const orders = await Order.count();
  return res.status(200).json(orders);
});

router.get("/:id", async (req, res, next) => {
  const id = req.params.id;
  if (!id || !mongoose.isValidObjectId(id)) {
    res.status(400).json({
      success: false,
      message: "Invalid ID",
    });
  }
  const orders = await Order.findById(id)
    .populate("user", "name email")
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        populate: "category",
      },
    });
  return res.status(200).json(orders);
});

router.post(`/`, async (req, res, next) => {
  try {
    const orderPayload = req.body;

    const orderItems = await Promise.all(
      orderPayload.orderItems.map(async (orderItem) => {
        let newOrderItem = new OrderItem(orderItem);
        newOrderItem = await newOrderItem.save();
        return newOrderItem._id;
      })
    );

    const orderItemsTotalPrice = await Promise.all(
      orderItems.map(async (orderItem) => {
        const orderItemDetail = await OrderItem.findById(orderItem).populate(
          "product",
          "price"
        );
        return orderItemDetail.quantity * orderItemDetail.product.price;
      })
    );

    const totalPrice = orderItemsTotalPrice.reduce(
      (current, next) => current + next,
      0
    );

    let order = new Order({
      ...orderPayload,
      orderItems,
      totalPrice,
    });
    order = await order.save();
    if (!order) {
      res.status(500).json({
        message: "Order cannot be created!",
        success: false,
      });
    }
    return res.status(200).json(order);
  } catch (error) {
    console.log(error.message);
  }
});

router.put(`/:id`, async (req, res, next) => {
  try {
    const orderPayload = req.body;
    // let order = {};
    const id = req.params.id;
    if (!id || !mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid ID",
      });
    }
    const order = await Order.findById(id)
      .populate("user", "name email")
      .populate({
        path: "orderItems",
        populate: {
          path: "product",
          populate: "category",
        },
      });
    if (orderPayload.orderItem) {
      const orderItems = await Promise.all(
        orderPayload.orderItems.map(async (orderItem) => {
          let newOrderItem = new OrderItem(orderItem);
          newOrderItem = await newOrderItem.save();
          return newOrderItem._id;
        })
      );
      order.orderItems = orderItems;
      const orderItemsTotalPrice = await Promise.all(
        orderItems.map(async (orderItem) => {
          const orderItemDetail = await OrderItem.findById(orderItem).populate(
            "product",
            "price"
          );
          return orderItemDetail.quantity * orderItemDetail.product.price;
        })
      );
      order.totalPrice = orderItemsTotalPrice.reduce(
        (current, next) => current + next,
        0
      );
    }

    const newOrder = await Order.findByIdAndUpdate(
      id,
      { ...orderPayload },
      { new: true }
    );
    return res.status(200).json(newOrder);
  } catch (error) {
    console.log(error.message);
  }
});

router.delete("/:id", async (req, res, next) => {
  const id = req.params.id;
  Order.findByIdAndRemove(id)
    .then(async (order) => {
      if (order) {
        await order.orderItems.map(async (item) => {
          await OrderItem.findByIdAndDelete(item._id);
        });
        return res
          .status(200)
          .json({ success: true, message: "Order was deleted!" });
      }
      return res
        .status(404)
        .json({ success: false, message: "Order not found!" });
    })
    .catch((err) => {
      return res.status(400).json({ success: false, error: err });
    });
});

router.get("/get/total-sales", async (req, res, next) => {
  const totalSales = await Order.aggregate([
    {
      $group: { _id: null, totalsales: { $sum: "$totalPrice" } },
    },
  ]);
  if (!totalSales) {
    return res.status(400).json("The order sales can not be generated");
  }
  // return res.status(200).json({ totalSales});
  return res.status(200).json(totalSales.pop().totalsales);
});
router.get("/get/user-orders/:userId", async (req, res, next) => {
  const userId = req.params.userId;
  if (!userId && !mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ success: false, message: "Invalid user Id" });
  }
  const orders = await Order.find({
    user: userId,
  }).sort({ orderDate: -1 });
  return res.status(200).json({ orders });
});

router.post("/create-checkout-session", async (req, res, next) => {
  const orderItems = req.body;
  if (!orderItems) {
    res.status(400).json({
      message: "Checkout session cannot be created - check the order items",
      success: false,
    });
  }
  const lineItems = await Promise.all(
    orderItems.map(async (orderItem) => {
      const product = await Product.findById(orderItem.product);
      return {
        // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
          },
          unit_amount: product.price * 100,
        },
        quantity: orderItem.quantity,
      };
    })
  );
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: "http://localhost:4200/success",
    cancel_url: "http://localhost:4200/error",
  });
  res.json({ id: session.id });
});

module.exports = router;
