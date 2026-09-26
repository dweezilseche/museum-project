import nodemailer from "nodemailer";

import { qrDataUrl } from "@/lib/qr";
import { TICKET_TYPE_MAP, formatPrice } from "@/lib/pricing";

// A single cached Ethereal test account/transport for the whole dev session.
// Ethereal doesn't deliver to real inboxes — every message gets a preview URL
// we surface to the buyer instead.
let transporterPromise = null;

async function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      const account = await nodemailer.createTestAccount();
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: account.user, pass: account.pass },
      });
    })();
  }
  return transporterPromise;
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function buildHtml(order) {
  const rows = await Promise.all(
    order.tickets.map(async (ticket) => {
      const type = TICKET_TYPE_MAP[ticket.category];
      const qr = await qrDataUrl(ticket.reference);
      return `
        <tr>
          <td style="padding:16px 0;border-top:1px solid #e7e4df;vertical-align:top;">
            <div style="font-style:italic;font-size:16px;color:#16130f;">${type?.label ?? ticket.category}</div>
            <div style="color:#a29e97;font-size:13px;margin-top:4px;">${ticket.reference}</div>
          </td>
          <td style="padding:16px 0;border-top:1px solid #e7e4df;text-align:right;">
            <img src="${qr}" width="96" height="96" alt="QR ${ticket.reference}" style="display:inline-block;" />
          </td>
        </tr>`;
    }),
  );

  return `
  <div style="font-family:Georgia,'Times New Roman',serif;color:#16130f;max-width:560px;margin:0 auto;padding:32px 24px;">
    <h1 style="font-size:22px;font-weight:normal;margin:0 0 4px;">Museum</h1>
    <p style="color:#a29e97;margin:0 0 28px;font-size:13px;">Your tickets</p>

    <p style="font-size:15px;line-height:1.6;">
      Thank you for your booking. Your visit is confirmed for
      <strong>${formatDate(order.visit_date)}</strong>.
    </p>
    <p style="color:#a29e97;font-size:13px;">
      Booking reference <strong style="color:#16130f;">${order.reference}</strong>
      &middot; Total ${formatPrice(order.amount_total)}
    </p>

    <table style="width:100%;border-collapse:collapse;margin-top:20px;">
      <tbody>${rows.join("")}</tbody>
    </table>

    <p style="color:#a29e97;font-size:12px;line-height:1.6;margin-top:28px;border-top:1px solid #e7e4df;padding-top:16px;">
      Present each QR code at the entrance. Under-18 tickets must be accompanied
      by a paying adult. We look forward to welcoming you.
    </p>
  </div>`;
}

// Send the tickets email and return the Ethereal preview URL (or null).
export async function sendTicketsEmail(order) {
  const transporter = await getTransporter();
  const html = await buildHtml(order);

  const info = await transporter.sendMail({
    from: '"Museum" <tickets@museum.art>',
    to: order.email,
    subject: `Your Museum tickets — ${order.reference}`,
    html,
  });

  return nodemailer.getTestMessageUrl(info) || null;
}
