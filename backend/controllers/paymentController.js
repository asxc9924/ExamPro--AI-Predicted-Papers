const crypto   = require("crypto");
const Razorpay = require("razorpay");
const { PredictedPaper, Order, Purchase } = require("../models/Paper");
const { sendPurchaseConfirmationEmail } = require("../utils/email");

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── CREATE ORDER ─────────────────────────────────────────────
exports.createOrder = async (req, res, next) => {
  try {
    const { paperId } = req.body;
    if (!paperId) return res.status(400).json({ success: false, error: "paperId is required" });

    // Check paper exists and is active
    const paper = await PredictedPaper.findOne({ _id: paperId, isActive: true }).populate("examId", "title shortName");
    if (!paper) return res.status(404).json({ success: false, error: "Paper not found" });

    // Check if already purchased
    const alreadyPurchased = await Purchase.findOne({ userId: req.user._id, paperId, isActive: true });
    if (alreadyPurchased) return res.status(400).json({ success: false, error: "You already own this paper" });

    // Create Razorpay order
    const receipt = `ee_${req.user._id.toString().slice(-6)}_${Date.now()}`;
    const rzpOrder = await razorpay.orders.create({
      amount:   paper.price, // already in paise
      currency: "INR",
      receipt,
      notes: {
        paperId:  paperId,
        userId:   req.user._id.toString(),
        examTitle: typeof paper.examId === "object" ? paper.examId.title : "",
      },
    });

    // Save pending order to DB
    await Order.create({
      userId:          req.user._id,
      paperId:         paper._id,
      amount:          paper.price,
      razorpayOrderId: rzpOrder.id,
      status:          "pending",
      receipt,
    });

    res.json({
      success: true,
      data: {
        order: { id: rzpOrder.id, amount: rzpOrder.amount, currency: rzpOrder.currency },
        paper: { _id: paper._id, title: paper.title, price: paper.price },
      },
    });
  } catch (err) { next(err); }
};

// ── VERIFY PAYMENT ───────────────────────────────────────────
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paperId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: "Missing payment details" });
    }

    // ── HMAC Signature Verification ──────────────────────────
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      // Mark order as failed
      await Order.findOneAndUpdate({ razorpayOrderId: razorpay_order_id }, { status: "failed" });
      return res.status(400).json({ success: false, error: "Payment verification failed. Signature mismatch." });
    }

    // Find order
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) return res.status(404).json({ success: false, error: "Order not found" });

    // Prevent double processing
    if (order.status === "paid") {
      return res.json({ success: true, message: "Payment already processed", data: { alreadyProcessed: true } });
    }

    // Update order status
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.status = "paid";
    await order.save();

    // Grant access (upsert to handle edge cases)
    const purchase = await Purchase.findOneAndUpdate(
      { userId: req.user._id, paperId: order.paperId },
      {
        $setOnInsert: {
          userId:      req.user._id,
          paperId:     order.paperId,
          orderId:     order._id,
          paymentId:   razorpay_payment_id,
          amount:      order.amount,
          purchasedAt: new Date(),
          isActive:    true,
        },
      },
      { upsert: true, new: true }
    ).populate({ path: "paperId", populate: { path: "examId", select: "title" } });

    // Increment download count
    await PredictedPaper.findByIdAndUpdate(order.paperId, { $inc: { downloadCount: 1 } });

    // Send confirmation email (non-blocking)
    sendPurchaseConfirmationEmail(req.user.email, req.user.name, purchase).catch(console.error);

    res.json({ success: true, message: "Payment verified! Paper unlocked.", data: { purchase } });
  } catch (err) { next(err); }
};

// ── RAZORPAY WEBHOOK ─────────────────────────────────────────
exports.webhook = async (req, res, next) => {
  try {
    const webhookSignature = req.headers["x-razorpay-signature"];
    const webhookSecret    = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret && webhookSignature) {
      // req.body is a raw Buffer when this route uses express.raw()
      const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
      const expectedSig = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (expectedSig !== webhookSignature) {
        return res.status(400).json({ success: false, error: "Invalid webhook signature" });
      }
    }

    // Parse body if it came in as a Buffer
    const event = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : req.body;
    console.log(`[Webhook] Event: ${event.event}`);

    switch (event.event) {
      case "payment.captured": {
        const payment = event.payload.payment.entity;
        await Order.findOneAndUpdate(
          { razorpayOrderId: payment.order_id },
          { status: "paid", razorpayPaymentId: payment.id }
        );
        break;
      }
      case "payment.failed": {
        const payment = event.payload.payment.entity;
        await Order.findOneAndUpdate(
          { razorpayOrderId: payment.order_id },
          { status: "failed" }
        );
        break;
      }
      case "refund.created": {
        const refund = event.payload.refund.entity;
        await Order.findOneAndUpdate(
          { razorpayPaymentId: refund.payment_id },
          { status: "refunded" }
        );
        break;
      }
    }

    res.json({ success: true });
  } catch (err) { next(err); }
};

// ── PAYMENT HISTORY ──────────────────────────────────────────
exports.getHistory = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate("paperId", "title examId price")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
};
