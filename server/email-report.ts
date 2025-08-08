import express from "express";
import { sendBloodSugarReport } from "./email";

const router = express.Router();

router.post("/api/email-report", async (req, res) => {
  try {
    const { to, startDate, endDate, readingCount, pdfBase64, userEmail } = req.body;

    if (!to || !startDate || !endDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Convert PDF from base64 string to Buffer
    const pdfBuffer = pdfBase64 ? Buffer.from(pdfBase64, "base64") : Buffer.from([]);

    const ok = await sendBloodSugarReport(
      to,
      userEmail,
      pdfBuffer,
      { start: startDate, end: endDate },
      Number(readingCount || 0)
    );

    if (!ok) {
      return res.status(500).json({ error: "Failed to send email" });
    }

    res.json({ ok: true });
  } catch (error: any) {
    console.error("Email send error:", error);
    res.status(500).json({ error: error.message || "Unexpected error" });
  }
});

export default router;
