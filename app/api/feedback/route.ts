import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { uploadToBlob } from "@/lib/blob";
import { ensureFeedbackSchema } from "@/lib/feedback-schema";
import { resend } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const session = await auth();
    await ensureFeedbackSchema();

    const formData = await request.formData();
    const message = formData.get("message") as string;
    const screenshot = formData.get("screenshot") as File | null;
    const pageUrl = formData.get("pageUrl") as string;
    const userAgent = request.headers.get("user-agent") || "Unknown";

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    let screenshotUrl: string | null = null;

    // Upload screenshot if provided
    if (screenshot && screenshot.size > 0) {
      const buffer = Buffer.from(await screenshot.arrayBuffer());
      const blob = await uploadToBlob(
        `feedback/${Date.now()}-${screenshot.name}`,
        new Blob([buffer], { type: screenshot.type || "image/png" })
      );
      screenshotUrl = blob.url;
    }

    const feedbackId = randomUUID();

    // Save to database
    await sql`
      INSERT INTO feedback (id, user_id, user_email, message, screenshot_url, user_agent, page_url)
      VALUES (
        ${feedbackId},
        ${session?.user?.id || null},
        ${session?.user?.email || null},
        ${message},
        ${screenshotUrl},
        ${userAgent},
        ${pageUrl}
      )
    `;

    // Send email notification if Resend is configured
    if (resend) {
      try {
        await resend.emails.send({
          from: "BMAX Feedback <feedback@resend.dev>", // Update this after verifying your domain
          to: "maxim.efremov@gmail.com",
          subject: `New Feedback from ${session?.user?.email || "Anonymous"}`,
          html: `
            <h2>New Feedback Received</h2>
            <p><strong>From:</strong> ${session?.user?.email || "Anonymous user"}</p>
            <p><strong>Page:</strong> ${pageUrl}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, "<br>")}</p>
            ${screenshotUrl ? `<p><strong>Screenshot:</strong> <a href="${screenshotUrl}">View</a></p>` : ""}
            <hr>
            <p><small>User Agent: ${userAgent}</small></p>
            <p><small>Feedback ID: ${feedbackId}</small></p>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ success: true, id: feedbackId });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}

