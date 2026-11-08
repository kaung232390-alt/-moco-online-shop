# MOCO ONLINE SHOP

ဒီ Project သည် MOCO ONLINE SHOP အတွက် ပြန်လည်တည်ဆောက်ထားသော Node.js Online Shop ဖြစ်သည်။

## ပါဝင်သောအရာများ
- Customer storefront နှင့် Product listing
- Size 2XL, 3XL, 4XL, 5XL ရွေးချယ်မှု
- Cart နှင့် Cash on Delivery checkout
- Order တင်ပြီးချိန်တွင် stock အလိုအလျောက်လျော့ခြင်း
- Stock မလုံလောက်ပါက order ပိတ်ခြင်း
- Admin login / dashboard
- Product အသစ်ထည့်ခြင်း၊ stock ပြင်ခြင်း၊ product ဖျောက်ခြင်း
- Order ကြည့်ခြင်းနှင့် status ပြောင်းခြင်း
- Telegram order notification (bot token/chat ID ထည့်ထားမှ အလုပ်လုပ်မည်)

## လိုအပ်ချက်
Node.js 18 သို့မဟုတ် အထက်

## စတင်အသုံးပြုရန်
1. ZIP ကို Extract လုပ်ပါ။
2. Project folder ထဲတွင် Terminal ဖွင့်ပါ။
3. `npm install` ရိုက်ပါ။
4. `.env.example` ကို `.env` အဖြစ် copy လုပ်ပါ။
5. `.env` ထဲတွင် `ADMIN_PASSWORD` ကို မဖြစ်မနေ ပြောင်းပါ။
6. Telegram အသိပေးချက်လိုပါက `TELEGRAM_BOT_TOKEN` နှင့် `TELEGRAM_CHAT_ID` ဖြည့်ပါ။
7. `npm start` ရိုက်ပါ။
8. Browser မှ `http://localhost:3000` ကိုဖွင့်ပါ။
9. Admin အတွက် `http://localhost:3000/admin` ကိုဖွင့်ပါ။

## Telegram ချိတ်ဆက်ခြင်း
- BotFather မှ token အသစ်ထုတ်ပြီး `.env` ထဲထည့်ပါ။ အရင်က chat ထဲပေါ်ခဲ့သော token ကို မသုံးပါနှင့်၊ revoke လုပ်ပါ။
- Order notification လက်ခံမည့် Telegram account သည် bot ကို အရင်ဆုံး `/start` ပို့ထားရပါမည်။
- `TELEGRAM_CHAT_ID` သည် notification လက်ခံမည့် chat ID ဖြစ်သည်။ `@username` ကို Telegram Bot API `sendMessage` ၏ `chat_id` အဖြစ် အမြဲအသုံးပြု၍မရပါ။ ကိုယ်ပိုင် chat ID ကို ရယူပြီးထည့်ပါ။

## လုံခြုံရေးနှင့် Hosting
- `.env` ကို မည်သူ့ကိုမျှ မပေးပါနှင့်။ GitHub သို့ မတင်ပါနှင့်။
- `SESSION_SECRET` နှင့် `ADMIN_PASSWORD` ကို ခန့်မှန်းရခက်သောတန်ဖိုးများဖြင့် ပြောင်းပါ။
- ဒီ starter project သည် JSON ဖိုင်ဖြင့် data သိမ်းသည်။ စမ်းသပ်/အသေးစားဆိုင်အတွက် ရည်ရွယ်ထားပြီး production အတွက် database၊ HTTPS၊ persistent session store၊ backup နှင့် rate limiting ထပ်ထည့်ရန် အကြံပြုသည်။
- Hosting တင်ရာတွင် Node.js app ကို support လုပ်သော service လိုအပ်သည်။ `npm install` ပြီး `npm start` ဖြင့် run ပါ။

## Data
ပထမဆုံး run လုပ်သည့်အခါ `data.json` ကို အလိုအလျောက်ဖန်တီးမည်။ ဒီဖိုင်တွင် products နှင့် orders သိမ်းထားသည်။ Backup ပုံမှန်ယူပါ။
