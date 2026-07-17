export const EMAIL_BRAND = {
  name: "Tuned & Threaded",
  tagline: "Built in the garage. Worn everywhere.",
  accent: "#c4121a",
  bg: "#0a0a0b",
  surface: "#141416",
  elevated: "#1c1c1f",
  text: "#f2f2f0",
  muted: "#9a9aa3",
  metal: "#b8b8c0",
  border: "rgba(180,180,190,0.18)",
} as const;

export function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.tunedandthreaded.com"
  );
}

export function emailLayout(input: {
  preheader?: string;
  title: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
}): string {
  const { name, tagline, accent, bg, surface, elevated, text, muted, metal, border } =
    EMAIL_BRAND;
  const logoUrl = `${siteUrl()}/brand/email-mark.png`;
  const cta = input.cta
    ? `<tr><td style="padding:28px 0 8px;">
        <a href="${input.cta.href}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:600;letter-spacing:0.03em;padding:15px 28px;border-radius:0;">
          ${input.cta.label}
        </a>
      </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>${input.title}</title>
</head>
<body style="margin:0;padding:0;background:${bg};color:${text};-webkit-font-smoothing:antialiased;">
  ${input.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${input.preheader}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${surface};border:1px solid ${border};">
          <tr>
            <td style="padding:26px 28px;border-bottom:1px solid ${border};background:${elevated};">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="vertical-align:middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:42px;height:42px;background:${accent};color:#fff;font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.08em;text-align:center;vertical-align:middle;line-height:42px;">
                          TT
                        </td>
                        <td style="padding-left:14px;">
                          <div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:600;color:${text};letter-spacing:0.02em;line-height:1.2;">
                            ${name}
                          </div>
                          <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${metal};margin-top:4px;">
                            Garage
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- logo fallback path for clients that load remote assets: ${logoUrl} -->
            </td>
          </tr>
          <tr>
            <td style="padding:34px 28px 10px;font-family:Helvetica,Arial,sans-serif;">
              <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${metal};">Tuned &amp; Threaded</p>
              <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.2;font-weight:600;color:${text};">${input.title}</h1>
              <div style="font-size:15px;line-height:1.7;color:${muted};">${input.bodyHtml}</div>
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 30px;border-top:1px solid ${border};font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.65;color:${muted};">
              <p style="margin:0 0 10px;color:${text};">${tagline}</p>
              <p style="margin:0;">
                <a href="${siteUrl()}/garage/settings/notifications" style="color:${metal};text-decoration:underline;">Notification settings</a>
                &nbsp;·&nbsp;
                <a href="${siteUrl()}/garage/settings/communication" style="color:${metal};text-decoration:underline;">Communication</a>
                &nbsp;·&nbsp;
                <a href="${siteUrl()}" style="color:${metal};text-decoration:underline;">${name}</a>
              </p>
              <p style="margin:14px 0 0;color:${metal};font-size:11px;">
                Security emails are always sent. Optional activity mail follows your notification preferences.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
