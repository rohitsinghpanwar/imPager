import nodemailer from 'nodemailer'

// Temporary storage for OTPs (Use Redis or DB in production)
const otpStorage = new Map();

/**
 * Sends an OTP email.
 * @param {string} email - Recipient email address.
 * @returns {Promise<boolean>} - Returns true if email sent, else false.
 */
const sendOtp = async (email) => {
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    otpStorage.set(email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 }); // Expires in 5 min

    // Configure email transporter
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER, // Your email
            pass: process.env.EMAIL_PASS, // App password (Use environment variables)
        },
    });

    // Email message
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(otp)
        return true;
    } catch (error) {
        console.error("Error sending OTP:", error);
        return false;
    }
};

/**
 * Verifies the OTP entered by the user.
 * @param {string} email - User email.
 * @param {string} otp - OTP entered by the user.
 * @returns {boolean} - Returns true if OTP is valid, else false.
 */
const verifyOtp = (email, otp) => {
    const storedOtpData = otpStorage.get(email);

    if (!storedOtpData) {
        console.log("No OTP stored for email");
        return false;
    }
    if (Date.now() > storedOtpData.expiresAt) {
        console.log("OTP expired");
        return false;
    }
    if (storedOtpData.otp.toString() !== otp.toString()) {
        console.log("OTP mismatch");
        return false;
    }

    otpStorage.delete(email);
    return true;
};


export { sendOtp, verifyOtp };
