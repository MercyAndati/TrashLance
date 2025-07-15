const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send SMS function
const sendSMS = async ({ to, message }) => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.warn('Twilio credentials not configured, SMS not sent');
      return { success: false, error: 'SMS service not configured' };
    }

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to
    });

    console.log('SMS sent successfully:', result.sid);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw error;
  }
};

// Send bulk SMS
const sendBulkSMS = async (messages) => {
  const results = [];
  
  for (const msg of messages) {
    try {
      const result = await sendSMS(msg);
      results.push({ success: true, sid: result.sid, to: msg.to });
    } catch (error) {
      results.push({ success: false, error: error.message, to: msg.to });
    }
  }
  
  return results;
};

// Send verification code
const sendVerificationCode = async (phone, code) => {
  const message = `Your Trashlance verification code is: ${code}. Valid for 10 minutes. Do not share this code with anyone.`;
  return await sendSMS({ to: phone, message });
};

// Send booking notification
const sendBookingNotification = async (phone, bookingDetails) => {
  const message = `Trashlance: Your booking for ${bookingDetails.service} on ${bookingDetails.date} has been ${bookingDetails.status}. Check the app for details.`;
  return await sendSMS({ to: phone, message });
};

// Send service reminder
const sendServiceReminder = async (phone, reminderDetails) => {
  const message = `Trashlance Reminder: Your ${reminderDetails.service} is scheduled for ${reminderDetails.time} today. Your service provider will arrive soon.`;
  return await sendSMS({ to: phone, message });
};

module.exports = {
  sendSMS,
  sendBulkSMS,
  sendVerificationCode,
  sendBookingNotification,
  sendServiceReminder
};