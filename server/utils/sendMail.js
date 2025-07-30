require("dotenv").config();
const nodemailer = require("nodemailer");
const { google } = require("googleapis");

// Create OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);
oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

// Factory to get a ready-to-send transporter
async function createTransporter() {
  const { token: accessToken } = await oAuth2Client.getAccessToken();

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.GMAIL_ADDRESS,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      accessToken,
    },
  });
}

// Function to send verification email
async function sendVerificationEmail(user, verifyCode) {
  const mailOpts = {
    from: process.env.GMAIL_ADDRESS,
    to: user.email,
    subject: "Nihesh's Seller Portal | Verification Code",
    html: `
      <!DOCTYPE html>
      <html lang="en" dir="ltr">
        <head>
          <title>Verification Code</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
            
            body {
              font-family: 'Poppins', sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f4f7fa;
              color: #333333;
              line-height: 1.6;
            }
            
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            }
            
            .header {
              text-align: center;
              padding: 30px 20px;
              background: linear-gradient(135deg, #e85f5c, #ff8a7a);
              color: white;
            }
            
            .logo {
              max-width: 180px;
              margin-bottom: 15px;
            }
            
            .content {
              padding: 30px;
            }
            
            h1 {
              margin: 0;
              font-weight: 600;
              font-size: 24px;
              color: white;
            }
            
            h2 {
              color: #e85f5c;
              font-weight: 600;
              margin-top: 0;
            }
            
            .verification-code {
              background-color: #fff8f7;
              border-radius: 8px;
              padding: 15px;
              margin: 25px 0;
              text-align: center;
              border: 1px dashed #ffd0cc;
              box-shadow: 0 2px 8px rgba(232, 95, 92, 0.1);
            }
            
            .code {
              font-size: 32px;
              font-weight: 700;
              color: #e85f5c;
              letter-spacing: 4px;
            }
            
            .footer {
              text-align: center;
              padding: 20px;
              font-size: 14px;
              color: #777777;
              background-color: #fff8f7;
              border-top: 1px solid #ffeae8;
            }
            
            .note {
              font-size: 13px;
              color: #888888;
              font-style: italic;
            }

            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #e85f5c;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
              margin: 15px 0;
              box-shadow: 0 2px 8px rgba(232, 95, 92, 0.2);
            }
            
            strong {
              color: #e85f5c;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="cid:logo" class="logo" alt="Nihesh's Seller Portal Logo">
              <h1>Email Verification</h1>
            </div>
            
            <div class="content">
              <h2>Hello ${user.firstName},</h2>
              <p>Thank you for registering with Nihesh's Seller Portal. To complete your registration, please use the verification code below:</p>
              
              <div class="verification-code">
                <span class="code">${verifyCode}</span>
              </div>
              
              <p>This verification code will expire in <strong>24 hours</strong>.</p>
              
              <p class="note">If you didn't request this verification code, please ignore this email or contact our support team if you believe this is an error.</p>
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Nihesh's Seller Portal. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hello ${user.firstName},\n\nThank you for registering with Nihesh Seller Portal. To complete your registration, please use the verification code: ${verifyCode}\n\nThis code will expire in 24 hours.\n\nIf you didn't request this verification code, please ignore this email.\n\n© ${new Date().getFullYear()} Nihesh's Seller Portal`,
    attachments: [
      {
        filename: "logo.png",
        path: __dirname + "/../../server/assets/image2.png",
        cid: "logo",
      },
    ],
  };

  try {
    const transporter = await createTransporter();
    await transporter.sendMail(mailOpts);
    console.log("Verification mail sent successfully to:", user.email);
    return { success: true, message: "Verification email sent successfully" };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return {
      success: false,
      message: "Failed to send verification email",
      error,
    };
  }
}

// Generate a 6-digit verification code
function generateVerifyCode() {
  return Math.floor(100000 + Math.random() * 900000);
}

// Set verification code expiry (24 hours from now)
function setVerifyCodeExpiry() {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  return expiry;
}

// Set next allowed resend time (24 hours from now)
function setNextResendTime() {
  const nextResend = new Date();
  nextResend.setHours(nextResend.getHours() + 24); // Allow resend after 24 hours
  return nextResend;
}

// Check if user can resend OTP
function canResendOTP(user) {
  if (!user.resendCode) {
    return true; // No resend date set, can resend
  }

  const now = new Date();
  return now >= user.resendCode; // Can resend if current time is after resendCode time
}

module.exports = {
  sendVerificationEmail,
  generateVerifyCode,
  setVerifyCodeExpiry,
  setNextResendTime,
  canResendOTP,
};
