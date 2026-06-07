// ── routes/user.js ───────────────────────────────────────────
const userRouter  = require("express").Router();
const userCtrl    = require("../controllers/userController");
const { protect } = require("../middleware/auth");

userRouter.get("/profile",              protect, userCtrl.getProfile);
userRouter.put("/profile",              protect, userCtrl.updateProfile);
userRouter.get("/purchases",            protect, userCtrl.getPurchases);
userRouter.get("/wishlist",             protect, userCtrl.getWishlist);
userRouter.post("/wishlist/:paperId",   protect, userCtrl.addToWishlist);
userRouter.delete("/wishlist/:paperId", protect, userCtrl.removeFromWishlist);

module.exports = userRouter;
