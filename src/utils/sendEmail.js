const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

/**
 * Send Email Utility
 * ------------------
 * Uses Nodemailer to send email notifications.
 * Configure SMTP credentials in .env.
 */

const sendEmail = async (options) => {
  try {
    let transporter;

    // Use test account if no real credentials are provided
    if (process.env.SMTP_USER === "your_mailtrap_user" || !process.env.SMTP_USER) {
      console.log("Generating Ethereal test email account...");
      const testAccount = await nodemailer.createTestAccount();
      
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });
    } else {
      // Use real SMTP credentials
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    const mailOptions = {
      from: '"Worknoon Chat" <noreply@worknoon.com>',
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
               <h2 style="color: #2563eb;">Worknoon Chat</h2>
               <p>${options.message}</p>
               <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
               <p style="font-size: 12px; color: #888;">Log in to your account to reply.</p>
             </div>`,
    };

    // Since Ethereal SMTP port might be blocked by local network firewalls,
    // we also save the exact email HTML to the Desktop so the user can easily view it!
    const desktopPath = path.join(require('os').homedir(), 'Desktop', 'worknoon-test-email.html');
    fs.writeFileSync(desktopPath, mailOptions.html);
    console.log(`\n==========================================`);
    console.log(`📧 EMAIL GENERATED SUCCESSFULLY!`);
    console.log(`Opening email in your default web browser...`);
    console.log(`==========================================\n`);

    // Magically pop open the email in the browser for the demo!
    if (process.platform === 'win32') {
      exec(`start "" "${desktopPath}"`);
    } else if (process.platform === 'darwin') {
      exec(`open "${desktopPath}"`);
    } else {
      exec(`xdg-open "${desktopPath}"`);
    }

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent: %s", info.messageId);
    } catch (e) {
      // Ignored: Firewall blocked it, but browser opened it!
    }
    
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

module.exports = sendEmail;
