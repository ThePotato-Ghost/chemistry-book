export default async function handler(req, res) {
  // 1. SECURITY CHECK: Only allow POST requests (since the frontend uses fetch with POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // 2. GET ORDER DATA: Extract the JSON payload sent from checkout_6.html
    const orderData = req.body;

    // ==========================================
    // ⚙️ TELEGRAM CONFIGURATION
    // ==========================================
    // NEVER hardcode tokens directly in the code for security.
    // Add these in your hosting provider's Environment Variables settings.
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      console.error("Missing environment variables.");
      return res.status(500).json({ error: "Server misconfiguration. Missing Telegram tokens." });
    }

    // ==========================================
    // 📝 MESSAGE FORMATTING (CUSTOMIZE HERE)
    // ==========================================
    // You can change the text, emojis, or layout below.
    // We are using 'HTML' parse mode, so you can use <b> for bold, <i> for italic, etc.
    const message = `
    📦 <b>নতুন অর্ডার এসেছে! (Oxygen Books)</b>
    🆔 অর্ডার আইডি: ${orderData.orderId}

    👤 <b>কাস্টমার ইনফরমেশন:</b>
    নাম: ${orderData.customer.name}
    ফোন: <b>${orderData.customer.phone}</b>
    ঠিকানা: ${orderData.customer.address}
    উপজেলা/থানা: ${orderData.customer.upazila || 'দেওয়া হয়নি'}
    জেলা: ${orderData.customer.district}

    🛍️ <b>অর্ডার সামারি:</b>
    বই: ${orderData.product}
    কপি: ${orderData.quantity}

    💰 <b>পেমেন্ট ডিটেইলস:</b>
    বইয়ের মূল্য: ৳ ${orderData.subtotal}
    ডেলিভারি চার্জ: ৳ ${orderData.shipping}
    <b>সর্বমোট বিল: ৳ ${orderData.total}</b>
    পেমেন্ট মেথড: ${orderData.paymentMethod}

    📅 <i>তারিখ: ${new Date(orderData.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })}</i>
    `;

    // ==========================================
    // 🚀 SEND REQUEST TO TELEGRAM
    // ==========================================
    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML', // Allows the <b> and <i> tags used above
      }),
    });

    const telegramResult = await response.json();

    // 3. HANDLE TELEGRAM RESPONSE
    if (!telegramResult.ok) {
      console.error("Telegram API Error:", telegramResult);
      throw new Error("Failed to send message to Telegram.");
    }

    // 4. SUCCESS: Tell the frontend the order was successful
    return res.status(200).json({
      success: true,
      message: 'Order successfully forwarded to Telegram'
    });

  } catch (error) {
    // 5. ERROR: Catch any crashes and tell the frontend
    console.error("Backend Error:", error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
}
