import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import orderRoutes from "./routes/order.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/chai", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
    },
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/orders", orderRoutes);

export default app;