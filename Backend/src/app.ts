import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import orderRoutes from "./routes/order.routes";
import kitchenRoutes from "./routes/kitchen.routes";

const app = express();

// middleware
app.use(cors());
app.use(express.json());

//Check Endpoint
app.get("/chai", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
    },
  });
});

app.use("/api/v1/auth", authRoutes);

app.use("/api/v1/me", userRoutes);

app.use("/api/v1/orders", orderRoutes);

app.use("/api/v1/kitchen", kitchenRoutes);

export default app;
