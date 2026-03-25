const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* ---------------- DB ---------------- */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

/* ---------------- MODELS ---------------- */

const User = mongoose.model("User", {
  username: { type: String, unique: true },
  password: String
});

const Config = mongoose.model("Config", {
  name: String,
  data: Object,
  userId: String
});

/* ---------------- AUTH ---------------- */

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.json({ success: false });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.json({ success: false });

  res.json({
    success: true,
    userId: user._id.toString()
  });
});

/* ---------------- CONFIG SYSTEM ---------------- */

app.post("/configs/create", async (req, res) => {
  const { name, data, userId } = req.body;

  const config = await Config.create({
    name,
    data,
    userId
  });

  res.json(config);
});

app.post("/configs/load", async (req, res) => {
  const { id } = req.body;

  const config = await Config.findById(id);
  res.json(config);
});

app.post("/configs/remove", async (req, res) => {
  const { id } = req.body;

  await Config.deleteOne({ _id: id });
  res.json({ success: true });
});

app.post("/configs/get", async (req, res) => {
  const { userId } = req.body;

  const configs = await Config.find({ userId });
  res.json(configs);
});

/* ---------------- TRACKING ---------------- */

app.post("/track/injection", async (req, res) => {
  const { username, info } = req.body;
  console.log("[TRACK INJECTION]", username, info);
  res.json({ success: true });
});

app.post("/track/roblox", async (req, res) => {
  const { robloxUsername, robloxUserId, discordUsername, ip, hwid } = req.body;

  console.log("[TRACK USER]", {
    robloxUsername,
    robloxUserId,
    discordUsername,
    ip,
    hwid
  });

  res.json({ success: true });
});

/* ---------------- HEALTH ---------------- */

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
