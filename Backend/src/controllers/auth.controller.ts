import { Request, Response } from "express";
import { db } from "../config/db"; // Aligned import syntax with your server.ts
import { generateOTP, maskPhone } from "../utils/generateOtp";

export const requestOtp = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { mobile } = req.body; // 10-digit normalized string from your validator

    // 1. Generate secure 4-digit OTP
    const rawOtp = generateOTP();

    // 2. Set expiration timestamp to current time + 5 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // 3. Save the plain-text 4-digit code to fit your VARCHAR(4) database constraint
    await db.query(
      "INSERT INTO otp_codes (phone, code, expires_at) VALUES (?, ?, ?)",
      [mobile, rawOtp, expiresAt],
    );

    // 4. REQUIREMENT: Print the clear text OTP to your server console
    console.log(`\n========================================`);
    console.log(`📱 OTP Request for: ${maskPhone(mobile)}`);
    console.log(`🔑 Generated OTP:  ${rawOtp}  (Captured for development)`);
    console.log(`========================================\n`);

    // 5. Return success response
    res.status(200).json({
      success: true,
      message: "OTP sent successfully to your console.",
    });
  } catch (error) {
    console.error("Error in requestOtp controller:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while processing OTP request.",
    });
  }
};
