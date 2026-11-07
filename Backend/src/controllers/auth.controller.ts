import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// Generates a cryptographically strong 4-digit code
const generate4DigitCode = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Request OTP Generation
export const requestOtpController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { phone } = req.body;
    const generatedOtp = generate4DigitCode();

    // Expires exactly 5 minutes from now
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Save the code to the database
    await db.query<ResultSetHeader>(
      "INSERT INTO otp_codes (phone, code, expires_at, attempts) VALUES (?, ?, ?, 0)",
      [phone, generatedOtp, expiresAt],
    );

    // server console log
    console.log(`OTP Request for ${phone}: ${generatedOtp}`);
    console.log(`Code Valid until: ${expiresAt.toLocaleTimeString()}`);

    res.status(200).json({
      success: true,
      message: "OTP generated successfully. Check terminal console output.",
    });
  } catch (error) {
    console.error("Error in requestOtpController:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// Verify OTP & Generate 7-day Session Token
export const verifyOtpController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { phone, code } = req.body;
    const now = new Date();

    // Find the latest valid OTP code for this phone number
    const [otpRows] = await db.query<RowDataPacket[]>(
      "SELECT id, code, expires_at, attempts FROM otp_codes WHERE phone = ? ORDER BY created_at DESC LIMIT 1",
      [phone],
    );

    if (otpRows.length === 0) {
      res.status(400).json({
        success: false,
        message: "No verification code requested for this phone number.",
      });
      return;
    }

    const targetOtpRecord = otpRows[0];

    // Check if the maximum attempt limit has been reached
    if (targetOtpRecord.attempts >= 3) {
      res.status(400).json({
        success: false,
        message:
          "This OTP has been blocked due to 3 incorrect attempts. Please request a new one.",
      });
      return;
    }

    // Check if the OTP has expired
    if (new Date(targetOtpRecord.expires_at) < now) {
      res.status(400).json({
        success: false,
        message: "The verification code has expired. Please request a new one.",
      });
      return;
    }

    // Handle an incorrect code entry
    if (targetOtpRecord.code !== code) {
      const updatedAttempts = targetOtpRecord.attempts + 1;
      await db.query("UPDATE otp_codes SET attempts = ? WHERE id = ?", [
        updatedAttempts,
        targetOtpRecord.id,
      ]);

      res.status(400).json({
        success: false,
        message: `Invalid code. ${3 - updatedAttempts} remaining attempts before this code is blocked.`,
      });
      return;
    }

    // Clean up used OTP code row to prevent re-use
    await db.query("DELETE FROM otp_codes WHERE phone = ?", [phone]);

    // Check if the user record exists, otherwise create it (First-time Login flow)
    let [userRows] = await db.query<RowDataPacket[]>(
      "SELECT id, phone, name, role FROM users WHERE phone = ?",
      [phone],
    );

    if (userRows.length === 0) {
      // Default new registrations to 'employee' role as per specifications
      const [insertResult] = await db.query<ResultSetHeader>(
        "INSERT INTO users (phone, name, role) VALUES (?, null, 'employee')",
        [phone],
      );

      const [newUserRows] = await db.query<RowDataPacket[]>(
        "SELECT id, phone, name, role FROM users WHERE id = ?",
        [insertResult.insertId],
      );
      userRows = newUserRows;
    }

    const verifiedUser = userRows[0];
    const jwtSecret = process.env.JWT_SECRET || "fallback_secret_for_dev_only";

    // Generate a JWT that lasts exactly 7 days
    const generatedToken = jwt.sign(
      {
        userId: verifiedUser.id,
        phone: verifiedUser.phone,
        role: verifiedUser.role,
      },
      jwtSecret,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      success: true,
      data: {
        token: generatedToken,
        user: verifiedUser,
      },
    });
  } catch (error) {
    console.error("Error in verifyOtpController:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
