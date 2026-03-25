const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* ---------------- ENV ---------------- */
const MONGO_URI = process.env.MONGO_URI;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;

/* ---------------- DB ---------------- */
mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("Mongo error:", err));

/* ---------------- MODELS ---------------- */

const User = mongoose.model("User", {
  username: { type: String, unique: true },
  password: String
});

const Config = mongoose.model("Config", {
  userId: String,
  name: String,
  data: Object
});

/* ---------------- DISCORD LOGGER ---------------- */

async function sendLog(message) {
  if (!DISCORD_WEBHOOK) return;
  try {
    await axios.post(DISCORD_WEBHOOK, {
      content: message
    });
  } catch (err) {
    console.error("Webhook error:", err.message);
  }
}

/* ---------------- AUTH ---------------- */

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) {
    await sendLog(`❌ Login failed (no user): ${username}`);
    return res.json({ success: false });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    await sendLog(`❌ Login failed (wrong password): ${username}`);
    return res.json({ success: false });
  }

  await sendLog(`✅ Login success: ${username}`);

  res.json({
    success: true,
    userId: user._id.toString()
  });
});

/* ---------------- CONFIGS ---------------- */

app.post("/configs/create", async (req, res) => {
  const { userId, name, data } = req.body;

  const config = await Config.create({
    userId,
    name,
    data
  });

  res.json(config);
});

app.get("/configs/:userId", async (req, res) => {
  const configs = await Config.find({ userId: req.params.userId });
  res.json(configs);
});

app.get("/configs/load/:id", async (req, res) => {
  const config = await Config.findById(req.params.id);
  res.json(config);
});

app.delete("/configs/delete/:id", async (req, res) => {
  await Config.deleteOne({ _id: req.params.id });
  res.json({ success: true });
});

/* ---------------- TRACKING ---------------- */

app.post("/track/event", async (req, res) => {
  const { message } = req.body;

  await sendLog(`📊 Event: ${message}`);

  res.json({ success: true });
});

app.post("/track/user", async (req, res) => {
  const { username, data } = req.body;

  await sendLog(`👤 User event: ${username} | ${JSON.stringify(data)}`);

  res.json({ success: true });
});

/* ---------------- HEALTH ---------------- */

app.get("/", (req, res) => {
  res.send("API running");
});

/* ---------------- START ---------------- */

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
