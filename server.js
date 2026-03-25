const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* -------------------- DB -------------------- */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("Mongo error:", err));

/* -------------------- MODELS -------------------- */

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  licenseKey: String
});

const ConfigSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  name: String,
  data: Object
});

const User = mongoose.model("User", UserSchema);
const Config = mongoose.model("Config", ConfigSchema);

/* -------------------- AUTH -------------------- */

app.post("/auth/login", async (req, res) => {
  const { username, password, licenseKey } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.json({ success: false });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.json({ success: false });

  // Optional license check
  if (user.licenseKey && licenseKey) {
    if (user.licenseKey !== licenseKey) {
      return res.json({ success: false, error: "Invalid license" });
    }
  }

  res.json({
    success: true,
    userId: user._id
  });
});

/* -------------------- CONFIGS -------------------- */

// Create config
app.post("/configs/create", async (req, res) => {
  const { userId, name, data } = req.body;

  const config = await Config.create({
    userId,
    name,
    data
  });

  res.json(config);
});

// Get configs
app.get("/configs/:userId", async (req, res) => {
  const configs = await Config.find({ userId: req.params.userId });
  res.json(configs);
});

// Load single config
app.get("/configs/load/:id", async (req, res) => {
  const config = await Config.findById(req.params.id);
  res.json(config);
});

// Delete config
app.delete("/configs/:id", async (req, res) => {
  await Config.deleteOne({ _id: req.params.id });
  res.json({ success: true });
});

/* -------------------- TRACKING -------------------- */

app.post("/track/injection", async (req, res) => {
  console.log("Injection tracked:", req.body);
  res.json({ success: true });
});

app.post("/track/user", async (req, res) => {
  console.log("User activity:", req.body);
  res.json({ success: true });
});

/* -------------------- HEALTH -------------------- */

app.get("/", (req, res) => {
  res.send("API running");
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
