import { emailLayout, siteUrl } from "@/lib/email/brand";

export type EmailTemplate = { subject: string; html: string };

function p(text: string) {
  return `<p style="margin:0 0 14px;">${text}</p>`;
}

function list(items: string[]) {
  return `<ul style="margin:0 0 14px;padding-left:18px;">${items
    .map((i) => `<li style="margin:0 0 6px;">${i}</li>`)
    .join("")}</ul>`;
}

export const templates = {
  welcome(): EmailTemplate {
    return {
      subject: "Welcome to the Garage!",
      html: emailLayout({
        preheader: "Your garage is officially open.",
        title: "Welcome to the Garage!",
        bodyHtml: [
          p("Welcome to Tuned & Threaded."),
          p("Your garage is officially open."),
          p("Start by:"),
          list([
            "Uploading your vehicle",
            "Creating your first build",
            "Sharing your first post",
            "Following other garages",
          ]),
        ].join(""),
        cta: { label: "Enter Your Garage", href: `${siteUrl()}/garage` },
      }),
    };
  },

  verifyEmail(verifyUrl: string): EmailTemplate {
    return {
      subject: "Verify your email",
      html: emailLayout({
        title: "Verify Email",
        bodyHtml: p(
          "Confirm your email to open the full Garage experience.",
        ),
        cta: { label: "Verify email", href: verifyUrl },
      }),
    };
  },

  passwordReset(resetUrl: string): EmailTemplate {
    return {
      subject: "Reset your password",
      html: emailLayout({
        title: "Password Reset",
        bodyHtml: p(
          "Use the button below to choose a new password. If you didn’t ask for this, you can ignore this email.",
        ),
        cta: { label: "Reset password", href: resetUrl },
      }),
    };
  },

  newFollower(actorName: string, garageUrl: string): EmailTemplate {
    return {
      subject: `${actorName} followed your Garage`,
      html: emailLayout({
        title: "New Follower",
        bodyHtml: p(
          `<strong style="color:#f2f2f0;">${actorName}</strong> started following your Garage.`,
        ),
        cta: { label: "View profile", href: garageUrl },
      }),
    };
  },

  newMessage(actorName: string, href: string): EmailTemplate {
    return {
      subject: `New message from ${actorName}`,
      html: emailLayout({
        title: "New Message",
        bodyHtml: p(
          `<strong style="color:#f2f2f0;">${actorName}</strong> sent you a message.`,
        ),
        cta: { label: "Open inbox", href },
      }),
    };
  },

  messageRequest(actorName: string, href: string): EmailTemplate {
    return {
      subject: `${actorName} sent a message request`,
      html: emailLayout({
        preheader: "Review a new message request in your Garage.",
        title: "Message Request",
        bodyHtml: p(
          `<strong style="color:#f2f2f0;">${actorName}</strong> wants to message you. Accept or decline from Message Requests.`,
        ),
        cta: { label: "Review request", href },
      }),
    };
  },

  journalLiked(actorName: string, href: string): EmailTemplate {
    return {
      subject: `${actorName} liked your journal entry`,
      html: emailLayout({
        title: "Journal Like",
        bodyHtml: p(
          `<strong style="color:#f2f2f0;">${actorName}</strong> liked your journal entry.`,
        ),
        cta: { label: "Open journal", href },
      }),
    };
  },

  galleryLiked(actorName: string, href: string): EmailTemplate {
    return {
      subject: `${actorName} liked your gallery photo`,
      html: emailLayout({
        title: "Gallery Like",
        bodyHtml: p(
          `<strong style="color:#f2f2f0;">${actorName}</strong> liked a photo in your gallery.`,
        ),
        cta: { label: "Open gallery", href },
      }),
    };
  },

  someoneCommented(actorName: string, context: string, href: string): EmailTemplate {
    return {
      subject: `${actorName} commented`,
      html: emailLayout({
        title: "Someone Commented",
        bodyHtml: p(
          `<strong style="color:#f2f2f0;">${actorName}</strong> commented on ${context}.`,
        ),
        cta: { label: "View comment", href },
      }),
    };
  },

  someoneReplied(actorName: string, href: string): EmailTemplate {
    return {
      subject: `${actorName} replied`,
      html: emailLayout({
        title: "Someone Replied",
        bodyHtml: p(
          `<strong style="color:#f2f2f0;">${actorName}</strong> replied to your comment.`,
        ),
        cta: { label: "View reply", href },
      }),
    };
  },

  someoneMentioned(actorName: string, href: string): EmailTemplate {
    return {
      subject: `${actorName} mentioned you`,
      html: emailLayout({
        title: "Someone Mentioned You",
        bodyHtml: p(
          `<strong style="color:#f2f2f0;">${actorName}</strong> mentioned you.`,
        ),
        cta: { label: "See mention", href },
      }),
    };
  },

  buildFollowed(actorName: string, buildTitle: string, href: string): EmailTemplate {
    return {
      subject: `${actorName} followed your build`,
      html: emailLayout({
        title: "Someone Followed Your Build",
        bodyHtml: p(
          `<strong style="color:#f2f2f0;">${actorName}</strong> followed “${buildTitle}”.`,
        ),
        cta: { label: "Open build", href },
      }),
    };
  },

  buildLiked(actorName: string, buildTitle: string, href: string): EmailTemplate {
    return {
      subject: `${actorName} liked your build`,
      html: emailLayout({
        title: "Someone Liked Your Build",
        bodyHtml: p(
          `<strong style="color:#f2f2f0;">${actorName}</strong> liked “${buildTitle}”.`,
        ),
        cta: { label: "Open build", href },
      }),
    };
  },

  postLiked(actorName: string, href: string): EmailTemplate {
    return {
      subject: `${actorName} liked your post`,
      html: emailLayout({
        title: "Someone Liked Your Post",
        bodyHtml: p(
          `<strong style="color:#f2f2f0;">${actorName}</strong> liked your post.`,
        ),
        cta: { label: "View post", href },
      }),
    };
  },

  buildShared(actorName: string, buildTitle: string, href: string): EmailTemplate {
    return {
      subject: `${actorName} shared your build`,
      html: emailLayout({
        title: "Someone Shared Your Build",
        bodyHtml: p(
          `<strong style="color:#f2f2f0;">${actorName}</strong> shared “${buildTitle}”.`,
        ),
        cta: { label: "Open build", href },
      }),
    };
  },

  buildFeatured(buildTitle: string, href: string): EmailTemplate {
    return {
      subject: "Your build was featured",
      html: emailLayout({
        title: "Build Featured",
        bodyHtml: p(`“${buildTitle}” was featured on Tuned & Threaded.`),
        cta: { label: "View build", href },
      }),
    };
  },

  garageFeatured(href: string): EmailTemplate {
    return {
      subject: "Your Garage was Featured",
      html: emailLayout({
        title: "Garage Featured",
        bodyHtml: p("Your Garage was featured. Nice work."),
        cta: { label: "Open Garage", href },
      }),
    };
  },

  badgeEarned(badgeLabel: string, href: string): EmailTemplate {
    return {
      subject: `Badge earned: ${badgeLabel}`,
      html: emailLayout({
        title: "Badge Earned",
        bodyHtml: p(`You earned the <strong style="color:#f2f2f0;">${badgeLabel}</strong> badge.`),
        cta: { label: "View profile", href },
      }),
    };
  },

  buildMilestone(buildTitle: string, milestone: string, href: string): EmailTemplate {
    return {
      subject: `Milestone: ${milestone}`,
      html: emailLayout({
        title: "Build Milestone Reached",
        bodyHtml: p(
          `“${buildTitle}” reached a milestone: <strong style="color:#f2f2f0;">${milestone}</strong>.`,
        ),
        cta: { label: "Open build", href },
      }),
    };
  },

  marketplacePurchase(orderId: string, href: string): EmailTemplate {
    return {
      subject: "Marketplace purchase confirmed",
      html: emailLayout({
        title: "Marketplace Purchase",
        bodyHtml: p(`Your marketplace purchase ${orderId.slice(0, 8)} is confirmed.`),
        cta: { label: "View order", href },
      }),
    };
  },

  orderConfirmation(orderLabel: string, href: string): EmailTemplate {
    return {
      subject: "Order confirmation",
      html: emailLayout({
        title: "Order Confirmation",
        bodyHtml: p(`Thanks for your order. ${orderLabel} is confirmed.`),
        cta: { label: "View order", href },
      }),
    };
  },

  orderReceipt(orderLabel: string, href: string): EmailTemplate {
    return {
      subject: "Your receipt",
      html: emailLayout({
        title: "Receipt",
        bodyHtml: p(`Your receipt for ${orderLabel} is ready.`),
        cta: { label: "Download receipt", href },
      }),
    };
  },

  orderShipped(tracking: string, carrier: string, href: string): EmailTemplate {
    return {
      subject: "Your order shipped",
      html: emailLayout({
        title: "Order Shipped",
        bodyHtml: [
          p("Your order is on the way."),
          p(`Carrier: <strong style="color:#f2f2f0;">${carrier}</strong>`),
          p(`Tracking: <strong style="color:#f2f2f0;">${tracking}</strong>`),
        ].join(""),
        cta: { label: "Track shipment", href },
      }),
    };
  },

  orderDelivered(href: string): EmailTemplate {
    return {
      subject: "Order delivered",
      html: emailLayout({
        title: "Order Delivered",
        bodyHtml: p("Your order was delivered. Enjoy the goods."),
        cta: { label: "View order", href },
      }),
    };
  },

  orderCancelled(href: string): EmailTemplate {
    return {
      subject: "Order cancelled",
      html: emailLayout({
        title: "Order Cancelled",
        bodyHtml: p("Your order was cancelled. If this looks wrong, contact support."),
        cta: { label: "View order", href },
      }),
    };
  },

  refundIssued(href: string): EmailTemplate {
    return {
      subject: "Refund issued",
      html: emailLayout({
        title: "Refund Issued",
        bodyHtml: p("A refund was issued for your order."),
        cta: { label: "View order", href },
      }),
    };
  },

  paymentFailed(href: string): EmailTemplate {
    return {
      subject: "Payment failed",
      html: emailLayout({
        title: "Payment Failed",
        bodyHtml: p(
          "We couldn’t process your payment. Update your payment method to continue.",
        ),
        cta: { label: "Review order", href },
      }),
    };
  },

  shippingUpdate(status: string, href: string): EmailTemplate {
    return {
      subject: `Shipping update: ${status}`,
      html: emailLayout({
        title: "Shipping Update",
        bodyHtml: p(`Status: <strong style="color:#f2f2f0;">${status}</strong>`),
        cta: { label: "Track order", href },
      }),
    };
  },

  digest(kind: "Daily" | "Weekly" | "Monthly", summaryHtml: string): EmailTemplate {
    return {
      subject: `${kind} Garage summary`,
      html: emailLayout({
        title: `${kind} Summary`,
        bodyHtml: summaryHtml,
        cta: { label: "Open Garage", href: `${siteUrl()}/garage` },
      }),
    };
  },

  // Security — always on
  passwordChanged(): EmailTemplate {
    return {
      subject: "Your password was changed",
      html: emailLayout({
        title: "Password Changed",
        bodyHtml: p(
          "Your Tuned & Threaded password was changed. If this wasn’t you, reset it immediately.",
        ),
        cta: { label: "Secure account", href: `${siteUrl()}/garage/settings/account` },
      }),
    };
  },

  emailChanged(newEmail: string): EmailTemplate {
    return {
      subject: "Your email was changed",
      html: emailLayout({
        title: "Email Changed",
        bodyHtml: p(
          `Your account email is now <strong style="color:#f2f2f0;">${newEmail}</strong>.`,
        ),
        cta: { label: "Review account", href: `${siteUrl()}/garage/settings/account` },
      }),
    };
  },

  newLogin(detail: string): EmailTemplate {
    return {
      subject: "New login to your account",
      html: emailLayout({
        title: "New Login",
        bodyHtml: p(`A new login was detected: ${detail}`),
        cta: { label: "Review security", href: `${siteUrl()}/garage/settings/account` },
      }),
    };
  },

  newDeviceLogin(detail: string): EmailTemplate {
    return {
      subject: "New device signed in",
      html: emailLayout({
        title: "New Device Login",
        bodyHtml: p(`A new device signed in: ${detail}`),
        cta: { label: "Review security", href: `${siteUrl()}/garage/settings/account` },
      }),
    };
  },

  twoFactorEnabled(): EmailTemplate {
    return {
      subject: "Two-factor authentication enabled",
      html: emailLayout({
        title: "2FA Enabled",
        bodyHtml: p("Two-factor authentication is now enabled on your account."),
        cta: { label: "Account settings", href: `${siteUrl()}/garage/settings/account` },
      }),
    };
  },

  marketing(
    topic: string,
    body: string,
    cta: { label: string; href: string },
  ): EmailTemplate {
    return {
      subject: topic,
      html: emailLayout({
        title: topic,
        bodyHtml: p(body),
        cta,
      }),
    };
  },
} as const;
