export const EMAIL_BRAND = {
  name: "Tuned & Threaded",
  accent: "#c4121a",
  bg: "#0a0a0b",
  surface: "#141416",
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
  const { name, accent, bg, surface, text, muted, metal, border } = EMAIL_BRAND;
  const logoMark = name
    .split(" ")
    .map((w) => w[0])
    .join("");
  const cta = input.cta
    ? `<tr><td style="padding:28px 0 8px;">
        <a href="${input.cta.href}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;letter-spacing:0.02em;padding:16px 28px;">
          ${input.cta.label}
        </a>
      </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${input.title}</title>
</head>
<body style="margin:0;padding:0;background:${bg};color:${text};">
  ${input.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${input.preheader}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${surface};border:1px solid ${border};">
          <tr>
            <td style="padding:28px 28px 12px;border-bottom:1px solid ${border};">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:40px;height:40px;background:${accent};color:#fff;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;text-align:center;vertical-align:middle;">
                    ${logoMark}
                  </td>
                  <td style="padding-left:14px;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;color:${text};letter-spacing:0.04em;">
                    ${name}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px 8px;font-family:Helvetica,Arial,sans-serif;">
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${metal};">Garage</p>
              <h1 style="margin:0 0 18px;font-size:26px;line-height:1.25;font-weight:600;color:${text};">${input.title}</h1>
              <div style="font-size:15px;line-height:1.65;color:${muted};">${input.bodyHtml}</div>
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 28px;border-top:1px solid ${border};font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:${muted};">
              <p style="margin:0 0 8px;">Built in the garage. Worn everywhere.</p>
              <p style="margin:0;">
                <a href="${siteUrl()}/garage/settings/communication" style="color:${metal};">Communication settings</a>
                &nbsp;·&nbsp;
                <a href="${siteUrl()}" style="color:${metal};">${name}</a>
              </p>
              <p style="margin:12px 0 0;color:${metal};font-size:11px;">
                Security and order emails are always sent. Marketing can be managed in settings.
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
