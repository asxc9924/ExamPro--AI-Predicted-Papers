// ── routes/payment.js ────────────────────────────────────────
const router      = require("express").Router();
const paymentCtrl = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

router.post("/create-order",  protect,              paymentCtrl.createOrder);
router.post("/verify",        protect,              paymentCtrl.verifyPayment);
router.post("/webhook",       /* raw body needed */ paymentCtrl.webhook);
router.get("/history",        protect,              paymentCtrl.getHistory);

module.exports = router;
