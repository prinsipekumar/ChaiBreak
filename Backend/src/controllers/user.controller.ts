import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { db } from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// GET /api/v1/me
export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: "Unauthorized token payload context.",
      });
      return;
    }

    const [userRows] = await db.query<RowDataPacket[]>(
      "SELECT id, phone, name, role, created_at FROM users WHERE id = ?",
      [req.user.id],
    );

    if (userRows.length === 0) {
      res
        .status(404)
        .json({ success: false, message: "User profile record not found." });
      return;
    }

    res.status(200).json({
      success: true,
      data: userRows[0],
    });
  } catch (error) {
    console.error("Error running getMe execution pathway:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error encountered while fetching profile.",
    });
  }
};

// PATCH /api/v1/me
export const updateMe = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: "Unauthorized token payload context.",
      });
      return;
    }

    const { name } = req.body;

    // Execute update statement
    const [updateResult] = await db.query<ResultSetHeader>(
      "UPDATE users SET name = ? WHERE id = ?",
      [name?.trim(), req.user.id],
    );

    // Fetch and return the updated user profile record
    const [userRows] = await db.query<RowDataPacket[]>(
      "SELECT id, phone, name, role, created_at FROM users WHERE id = ?",
      [req.user.id],
    );

    if (userRows.length === 0) {
      res.status(404).json({
        success: false,
        message: "User profile record not found after update.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: userRows[0],
    });
  } catch (error) {
    console.error("Error running updateMe execution pathway:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error encountered while updating profile.",
    });
  }
};
