const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email templates
const templates = {
  emailVerification: {
    subject: 'Verify Your Email - Trashlance',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5aa0;">Welcome to Trashlance!</h2>
        <p>Hi {{username}},</p>
        <p>Thank you for registering with Trashlance. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{verificationUrl}}" style="background-color: #2c5aa0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all;">{{verificationUrl}}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account with Trashlance, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This email was sent by Trashlance. If you have any questions, please contact our support team.
        </p>
      </div>
    `
  },
  
  passwordReset: {
    subject: 'Password Reset - Trashlance',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5aa0;">Password Reset Request</h2>
        <p>Hi {{username}},</p>
        <p>You requested to reset your password for your Trashlance account. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{resetUrl}}" style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all;">{{resetUrl}}</p>
        <p>This link will expire in 30 minutes.</p>
        <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This email was sent by Trashlance. If you have any questions, please contact our support team.
        </p>
      </div>
    `
  },
  
  newBooking: {
    subject: 'New Booking Request - Trashlance',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5aa0;">New Booking Request</h2>
        <p>Hi {{providerName}},</p>
        <p>You have received a new booking request from <strong>{{customerName}}</strong>.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Booking Details:</h3>
          <p><strong>Service:</strong> {{serviceName}}</p>
          <p><strong>Scheduled Date:</strong> {{scheduledDate}}</p>
          <p><strong>Customer:</strong> {{customerName}}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{bookingUrl}}" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Booking</a>
        </div>
        <p>Please log in to your account to review and respond to this booking request.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This email was sent by Trashlance. If you have any questions, please contact our support team.
        </p>
      </div>
    `
  },
  
  bookingConfirmed: {
    subject: 'Booking Confirmed - Trashlance',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Booking Confirmed!</h2>
        <p>Hi {{customerName}},</p>
        <p>Great news! Your booking has been confirmed by {{providerName}}.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Booking Details:</h3>
          <p><strong>Service:</strong> {{serviceName}}</p>
          <p><strong>Date & Time:</strong> {{scheduledDateTime}}</p>
          <p><strong>Provider:</strong> {{providerName}}</p>
          <p><strong>Total Amount:</strong> \$\{{totalAmount}}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{bookingUrl}}" style="background-color: #2c5aa0; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Booking</a>
        </div>
        <p>You will receive updates as your service provider prepares for your appointment.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          This email was sent by Trashlance. If you have any questions, please contact our support team.
        </p>
      </div>
    `
  }
};

// Replace template variables
const replaceTemplateVariables = (template, data) => {
  let result = template;
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, data[key] || '');
  });
  return result;
};

// Send email function
const sendEmail = async ({ to, subject, template, data, html, text }) => {
  try {
    const transporter = createTransporter();
    
    let emailHtml = html;
    let emailSubject = subject;
    
    // Use template if provided
    if (template && templates[template]) {
      emailHtml = replaceTemplateVariables(templates[template].html, data || {});
      emailSubject = templates[template].subject;
    }
    
    const mailOptions = {
      from: `"Trashlance" <${process.env.EMAIL_USER}>`,
      to,
      subject: emailSubject,
      html: emailHtml,
      text: text || emailHtml.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// Send bulk emails
const sendBulkEmails = async (emails) => {
  const results = [];
  
  for (const email of emails) {
    try {
      const result = await sendEmail(email);
      results.push({ success: true, messageId: result.messageId, to: email.to });
    } catch (error) {
      results.push({ success: false, error: error.message, to: email.to });
    }
  }
  
  return results;
};

// Verify email configuration
const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration verified successfully');
    return true;
  } catch (error) {
    console.error('Email configuration verification failed:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendBulkEmails,
  verifyEmailConfig
};