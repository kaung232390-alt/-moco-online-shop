require("dotenv").config();
const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");

const initialData = {
  products: [
    { id: "moco-001", name: "MOCO Basic T-Shirt", description: "နေ့စဉ်ဝတ်ရန် သက်တောင့်သက်သာရှိသော T-shirt", price: 25000, image: "", sizes: ["2XL","3XL","4XL","5XL"], stock: {"2XL":10,"3XL":10,"4XL":10,"5XL":10}, active: true },
    { id: "moco-002", name: "MOCO Premium T-Shirt", description: "Premium quality အထည်သား", price: 32000, image: "", sizes: ["2XL","3XL","4XL","5XL"], stock: {"2XL":5,"3XL":5,"4XL":5,"5XL":5}, active: true }
  ],
  orders: []
};
function loadData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
  catch { saveData(initialData); return structuredClone(initialData); }
}
function saveData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }
let db = loadData();

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  name: "moco.sid",
  secret: process.env.SESSION_SECRET || "replace-this-secret-before-deploying",
  resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 8 * 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, "public")));

function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.status(401).json({ error: "Admin login လုပ်ပါ။" });
}
function clean(s, max=200) { return String(s ?? "").trim().slice(0, max); }
async function sendTelegram(order) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  const lines = [
    "🛍️ MOCO ONLINE SHOP - ORDER အသစ်",
    `Order: ${order.id}`,
    `အမည်: ${order.customer.name}`,
    `ဖုန်း: ${order.customer.phone}`,
    `လိပ်စာ: ${order.customer.address}`,
    `ပစ္စည်း: ${order.items.map(x => `${x.name} (${x.size}) x${x.qty}`).join(", ")}`,
    `စုစုပေါင်း: ${order.total.toLocaleString("en-US")} MMK`,
    `ငွေပေးချေမှု: ${order.payment}`,
    `အချိန်: ${order.createdAt}`
  ];
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: lines.join("\n") })
    });
    if (!response.ok) console.error("Telegram notification failed:", await response.text());
  } catch (e) { console.error("Telegram error:", e.message); }
}

app.get("/api/products", (req, res) => {
  res.json(db.products.filter(p => p.active).map(({id,name,description,price,image,sizes,stock}) => ({id,name,description,price,image,sizes,stock})));
});

app.post("/api/orders", async (req, res) => {
  const customer = {
    name: clean(req.body?.customer?.name, 100),
    phone: clean(req.body?.customer?.phone, 40),
    address: clean(req.body?.customer?.address, 500)
  };
  const payment = clean(req.body?.payment || "Cash on Delivery", 40);
  const cart = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!customer.name || !customer.phone || !customer.address || !cart.length)
    return res.status(400).json({ error: "အမည်၊ ဖုန်း၊ လိပ်စာနှင့် ပစ္စည်းရွေးချယ်မှု ဖြည့်ပါ။" });

  const items = [];
  let total = 0;
  for (const entry of cart) {
    const product = db.products.find(p => p.id === clean(entry.id, 80) && p.active);
    const size = clean(entry.size, 10);
    const qty = Math.floor(Number(entry.qty));
    if (!product || !product.sizes.includes(size) || !Number.isInteger(qty) || qty < 1 || qty > 20)
      return res.status(400).json({ error: "ပစ္စည်းရွေးချယ်မှု မမှန်ကန်ပါ။" });
    if ((Number(product.stock[size]) || 0) < qty)
      return res.status(400).json({ error: `${product.name} (${size}) လက်ကျန်မလုံလောက်ပါ။` });
    items.push({ id: product.id, name: product.name, size, qty, price: Number(product.price) });
    total += Number(product.price) * qty;
  }
  // Recheck and decrement stock only after all cart lines have passed validation.
  for (const item of items) {
    const p = db.products.find(x => x.id === item.id);
    p.stock[item.size] = Number(p.stock[item.size]) - item.qty;
  }
  const order = {
    id: "MOCO-" + Date.now().toString().slice(-8),
    customer, items, total, payment, status: "Pending",
    createdAt: new Date().toLocaleString("en-GB", { timeZone: "Asia/Yangon" })
  };
  db.orders.unshift(order); saveData(db);
  await sendTelegram(order);
  res.status(201).json({ message: "အော်ဒါတင်ပြီးပါပြီ။ ကျေးဇူးတင်ပါတယ်။", orderId: order.id });
});

app.post("/api/admin/login", (req, res) => {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return res.status(503).json({ error: "ADMIN_PASSWORD ကို .env ထဲတွင် သတ်မှတ်ပါ။" });
  if (clean(req.body?.username, 100) !== username || String(req.body?.password || "") !== password)
    return res.status(401).json({ error: "Username သို့မဟုတ် Password မှားနေပါတယ်။" });
  req.session.admin = true;
  res.json({ message: "Login success" });
});
app.post("/api/admin/logout", requireAdmin, (req, res) => req.session.destroy(() => res.json({ message: "Logged out" })));
app.get("/api/admin/me", (req, res) => res.json({ loggedIn: !!req.session?.admin }));
app.get("/api/admin/data", requireAdmin, (req, res) => res.json(db));

app.post("/api/admin/products", requireAdmin, (req, res) => {
  const b = req.body || {};
  const name = clean(b.name, 120);
  const price = Number(b.price);
  if (!name || !Number.isFinite(price) || price < 0) return res.status(400).json({error:"အမည်နှင့် ဈေးနှုန်း မှန်ကန်စွာဖြည့်ပါ။"});
  const sizes = ["2XL","3XL","4XL","5XL"];
  const stock = {};
  for (const s of sizes) stock[s] = Math.max(0, Math.floor(Number(b.stock?.[s]) || 0));
  const product = {
    id: "moco-" + Date.now(), name, description: clean(b.description, 500),
    price, image: clean(b.image, 1000), sizes, stock, active: true
  };
  db.products.unshift(product); saveData(db); res.status(201).json(product);
});
app.put("/api/admin/products/:id", requireAdmin, (req, res) => {
  const p = db.products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({error:"Product မတွေ့ပါ။"});
  const b = req.body || {};
  if (b.name !== undefined) p.name = clean(b.name, 120);
  if (b.description !== undefined) p.description = clean(b.description, 500);
  if (b.price !== undefined && Number.isFinite(Number(b.price)) && Number(b.price) >= 0) p.price = Number(b.price);
  if (b.image !== undefined) p.image = clean(b.image, 1000);
  for (const s of p.sizes) if (b.stock?.[s] !== undefined) p.stock[s] = Math.max(0, Math.floor(Number(b.stock[s]) || 0));
  if (b.active !== undefined) p.active = !!b.active;
  saveData(db); res.json(p);
});
app.delete("/api/admin/products/:id", requireAdmin, (req, res) => {
  const p = db.products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({error:"Product မတွေ့ပါ။"});
  p.active = false; saveData(db); res.json({message:"Product hidden"});
});
app.patch("/api/admin/orders/:id", requireAdmin, (req, res) => {
  const order = db.orders.find(x => x.id === req.params.id);
  const allowed = ["Pending","Confirmed","Packing","Shipped","Delivered","Cancelled"];
  if (!order) return res.status(404).json({error:"Order မတွေ့ပါ။"});
  if (!allowed.includes(req.body?.status)) return res.status(400).json({error:"Status မမှန်ပါ။"});
  order.status = req.body.status; saveData(db); res.json(order);
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`MOCO ONLINE SHOP running at http://localhost:${PORT}`));
