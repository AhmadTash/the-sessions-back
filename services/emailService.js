const nodemailer = require('nodemailer');

// Create transporter using environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
  },
  // Add connection timeout and retry settings
  connectionTimeout: 60000, // 60 seconds
  greetingTimeout: 30000,   // 30 seconds
  socketTimeout: 60000,     // 60 seconds
  pool: true,               // Use connection pooling
  maxConnections: 5,        // Maximum number of connections
  maxMessages: 100,         // Maximum messages per connection
  rateDelta: 20000,         // Rate limiting
  rateLimit: 5              // Max 5 emails per rateDelta
});

// Function to send email notification
const sendVisitNotification = async (recipientEmail = 'douqa20@gmail.com') => {
  try {
    const mailOptions = {
      from: process.env.EMAIL,
      to: recipientEmail,
      subject: 'Visit Notification',
      text: 'She visited'
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVisitNotification
};
