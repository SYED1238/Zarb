// =========================================================================
// ZARB HAUTE COUTURE & LUXURY APPAREL — TRANSACTIONAL EMAIL TEMPLATES
// Responsive, cross-client HTML & plain-text templates with Zarb branding
// Verified Sender: Zarb <hello@zarb.shop>
// =========================================================================

export interface EmailTemplateData {
  customerName?: string;
  customerEmail?: string;
  orderNumber?: string;
  orderDate?: string;
  items?: Array<{
    name: string;
    price: number;
    quantity: number;
    size?: string;
    color?: string;
    image?: string;
  }>;
  subtotal?: number;
  shippingCost?: number;
  discountAmount?: number;
  totalAmount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  orderStatus?: string;
  shippingAddress?: {
    address?: string;
    apartment?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  actionUrl?: string;
  cancellationReason?: string;
  refundAmount?: number;
}

export interface GeneratedEmail {
  subject: string;
  html: string;
  text: string;
}

function formatINR(val?: number): string {
  if (val === undefined || val === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

// Master email layout wrapper
function wrapLayout(contentHtml: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>ZARB</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0c0c0e;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f4efe6;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    td {
      padding: 0;
    }
    img {
      border: 0;
      outline: none;
      text-decoration: none;
      display: block;
    }
    a {
      color: #f59e0b;
      text-decoration: none;
    }
    @media screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        border: none !important;
        border-radius: 0 !important;
      }
      .content-padding {
        padding: 24px 20px !important;
      }
      .stack-column {
        display: block !important;
        width: 100% !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0c0e;">
  <!-- Preview Text (Hidden in body) -->
  <div style="display: none; max-height: 0px; overflow: hidden;">
    ${previewText}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#0c0c0e" style="background-color: #0c0c0e; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table class="container" width="600" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #141418; border: 1px solid #27272e; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.6);">
          
          <!-- Header Branding -->
          <tr>
            <td align="center" style="padding: 36px 24px 28px 24px; border-bottom: 1px solid #27272a; background: linear-gradient(180deg, #18181f 0%, #141418 100%);">
              <a href="https://zarb.shop" target="_blank" style="text-decoration: none; display: inline-block;">
                <div style="letter-spacing: 0.35em; font-family: 'Times New Roman', Times, serif, Georgia; font-size: 26px; font-weight: 700; color: #ffffff; text-transform: uppercase;">
                  Z A R B
                </div>
                <div style="letter-spacing: 0.28em; font-size: 10px; font-weight: 500; color: #d97706; text-transform: uppercase; margin-top: 6px;">
                  HAUTE COUTURE &middot; ATELIER
                </div>
              </a>
            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td class="content-padding" style="padding: 36px 36px 32px 36px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Luxury Concierge Footer -->
          <tr>
            <td style="padding: 28px 36px; background-color: #0f0f13; border-top: 1px solid #232329; text-align: center;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <a href="https://zarb.shop" style="color: #a1a1aa; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 12px; font-weight: 500;">Storefront</a>
                    <span style="color: #3f3f46;">&middot;</span>
                    <a href="https://zarb.shop" style="color: #a1a1aa; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 12px; font-weight: 500;">Track Orders</a>
                    <span style="color: #3f3f46;">&middot;</span>
                    <a href="mailto:hello@zarb.shop" style="color: #a1a1aa; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 12px; font-weight: 500;">Concierge</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size: 12px; line-height: 1.6; color: #71717a;">
                    Direct questions to our client concierge: <a href="mailto:hello@zarb.shop" style="color: #f59e0b; text-decoration: underline;">hello@zarb.shop</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size: 11px; line-height: 1.5; color: #52525b; padding-top: 14px;">
                    &copy; ${new Date().getFullYear()} Zarb Haute Couture. All rights reserved.<br>
                    Crafted with distinction &bull; <a href="https://zarb.shop" style="color: #71717a;">zarb.shop</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// CTA button generator
function renderButton(text: string, url: string): string {
  return `
    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0 12px 0;">
      <tr>
        <td align="center">
          <a href="${url}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #d97706 0%, #b45309 100%); color: #ffffff; font-size: 14px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; text-decoration: none; padding: 15px 36px; border-radius: 12px; border: 1px solid #f59e0b; box-shadow: 0 6px 20px rgba(217, 119, 6, 0.35);">
            ${text} &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;
}

// Order Items Table generator
function renderOrderItems(items: NonNullable<EmailTemplateData['items']>): string {
  if (!items || items.length === 0) return '';

  const rows = items.map(item => `
    <tr style="border-bottom: 1px solid #232329;">
      <td style="padding: 14px 0; vertical-align: middle;">
        <div style="font-size: 14px; font-weight: 600; color: #ffffff; line-height: 1.4;">${item.name}</div>
        <div style="font-size: 12px; color: #a1a1aa; margin-top: 3px;">
          ${item.size ? `Size: <strong style="color: #e4e4e7;">${item.size}</strong> &middot; ` : ''}
          ${item.color ? `Color: <strong style="color: #e4e4e7;">${item.color}</strong> &middot; ` : ''}
          Qty: <strong style="color: #e4e4e7;">${item.quantity}</strong>
        </div>
      </td>
      <td align="right" style="padding: 14px 0; vertical-align: middle; font-size: 14px; font-weight: 600; color: #ffffff; white-space: nowrap;">
        ${formatINR(item.price * item.quantity)}
      </td>
    </tr>
  `).join('');

  return `
    <div style="margin-top: 24px;">
      <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #f59e0b; margin-bottom: 8px;">Order Silhouette Breakdown</div>
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="width: 100%;">
        ${rows}
      </table>
    </div>
  `;
}

// Order Summary & Financials
function renderOrderTotals(data: EmailTemplateData): string {
  return `
    <div style="background-color: #1a1a22; border: 1px solid #2b2b35; border-radius: 14px; padding: 18px 20px; margin-top: 24px;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="font-size: 13px; line-height: 1.8;">
        <tr>
          <td style="color: #a1a1aa;">Subtotal</td>
          <td align="right" style="color: #ffffff; font-weight: 500;">${formatINR(data.subtotal || data.totalAmount)}</td>
        </tr>
        ${data.discountAmount && data.discountAmount > 0 ? `
        <tr>
          <td style="color: #34d399;">Privilege Discount</td>
          <td align="right" style="color: #34d399; font-weight: 600;">-${formatINR(data.discountAmount)}</td>
        </tr>` : ''}
        <tr>
          <td style="color: #a1a1aa;">White-Glove Insured Delivery</td>
          <td align="right" style="color: #ffffff; font-weight: 500;">${data.shippingCost && data.shippingCost > 0 ? formatINR(data.shippingCost) : '<span style="color: #34d399; font-weight: 600;">COMPLIMENTARY</span>'}</td>
        </tr>
        <tr style="border-top: 1px solid #2e2e38;">
          <td style="padding-top: 10px; font-size: 15px; font-weight: 700; color: #ffffff;">Total Amount</td>
          <td align="right" style="padding-top: 10px; font-size: 17px; font-weight: 700; color: #f59e0b;">${formatINR(data.totalAmount)}</td>
        </tr>
      </table>
    </div>
  `;
}

// Shipping Destination Box
function renderShippingDestination(address?: EmailTemplateData['shippingAddress']): string {
  if (!address || !address.address) return '';
  return `
    <div style="background-color: #181820; border: 1px solid #272730; border-radius: 14px; padding: 16px 20px; margin-top: 20px;">
      <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #d97706; margin-bottom: 6px;">Delivery Destination</div>
      <div style="font-size: 13px; color: #e4e4e7; line-height: 1.5;">
        ${address.address}${address.apartment ? `, ${address.apartment}` : ''}<br>
        ${[address.city, address.state, address.postalCode].filter(Boolean).join(', ')}<br>
        ${address.country || 'India'}
      </div>
    </div>
  `;
}

// =========================================================================
// TEMPLATE BUILDERS
// =========================================================================

export function generateEmailContent(eventType: string, data: EmailTemplateData): GeneratedEmail {
  const customerGreeting = data.customerName ? `Dear ${data.customerName},` : 'Welcome,';
  const actionUrl = data.actionUrl || 'https://zarb.shop';

  switch (eventType) {
    // -----------------------------------------------------------------------
    // 1. WELCOME (NEW ACCOUNT SIGNUP)
    // -----------------------------------------------------------------------
    case 'welcome': {
      const subject = 'Welcome to Zarb';
      const html = wrapLayout(`
        <div style="text-align: center; padding-bottom: 12px;">
          <span style="display: inline-block; background-color: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); color: #f59e0b; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; padding: 5px 14px; border-radius: 9999px;">
            Account Confirmed
          </span>
        </div>
        <h1 style="font-family: 'Times New Roman', Times, serif, Georgia; font-size: 26px; font-weight: 600; text-align: center; color: #ffffff; margin: 12px 0 16px 0; letter-spacing: 0.05em;">
          Welcome to the World of Zarb
        </h1>
        <p style="font-size: 14px; line-height: 1.7; color: #d4d4d8; text-align: center; margin-bottom: 24px;">
          ${customerGreeting}<br>
          Your personal account has been created. Step inside our atelier to discover silhouettes tailored with architectural precision, rich fabrics, and timeless modern luxury.
        </p>
        <div style="background-color: #1a1a22; border: 1px solid #2b2b35; border-radius: 14px; padding: 20px; margin: 20px 0;">
          <div style="font-size: 13px; color: #e4e4e7; line-height: 1.8;">
            &bull; <strong>Saved Curations</strong> &mdash; Track your bespoke wishlist<br>
            &bull; <strong>Real-Time Provenance</strong> &mdash; Monitor atelier orders from tailoring to doorstep<br>
            &bull; <strong>Concierge Care</strong> &mdash; Priority styling support for every piece
          </div>
        </div>
        ${renderButton('Explore The Collections', actionUrl)}
      `, 'Welcome to Zarb. Your personal account is ready. Discover our modern luxury collections.');

      const text = `Welcome to Zarb\n\n${customerGreeting}\n\nYour personal account has been created.\nDiscover silhouettes tailored with architectural precision and timeless modern luxury.\n\nExplore Collections: ${actionUrl}\n\nClient Concierge: hello@zarb.shop\n© ${new Date().getFullYear()} Zarb Haute Couture`;
      return { subject, html, text };
    }

    // -----------------------------------------------------------------------
    // 2. WELCOME BACK (SUCCESSFUL SIGN-IN)
    // -----------------------------------------------------------------------
    case 'welcome_back': {
      const subject = 'Welcome back to Zarb';
      const html = wrapLayout(`
        <h1 style="font-family: 'Times New Roman', Times, serif, Georgia; font-size: 24px; font-weight: 600; text-align: center; color: #ffffff; margin: 8px 0 16px 0; letter-spacing: 0.05em;">
          Welcome Back to Zarb
        </h1>
        <p style="font-size: 14px; line-height: 1.7; color: #d4d4d8; text-align: center; margin-bottom: 24px;">
          ${customerGreeting}<br>
          We're glad to have you with us. Your personal dashboard, order provenance history, and curated silhouettes are ready for your return.
        </p>
        ${renderButton('Open Your Account', actionUrl)}
        <p style="font-size: 11px; line-height: 1.6; color: #71717a; text-align: center; margin-top: 24px;">
          If this sign-in was not authorized by you, please reach out immediately to our concierge at <a href="mailto:hello@zarb.shop" style="color: #f59e0b;">hello@zarb.shop</a>.
        </p>
      `, `Welcome back, ${data.customerName || 'Client'}. We're glad to have you with us.`);

      const text = `Welcome back to Zarb\n\n${customerGreeting}\n\nWe're glad to have you with us. Your account is ready for your return.\n\nAccess Account: ${actionUrl}\n\nIf you did not initiate this sign-in, contact hello@zarb.shop\n© ${new Date().getFullYear()} Zarb Haute Couture`;
      return { subject, html, text };
    }

    // -----------------------------------------------------------------------
    // 3. EMAIL VERIFICATION
    // -----------------------------------------------------------------------
    case 'verify_email': {
      const subject = 'Verify your Zarb account';
      const html = wrapLayout(`
        <h1 style="font-family: 'Times New Roman', Times, serif, Georgia; font-size: 24px; font-weight: 600; text-align: center; color: #ffffff; margin: 8px 0 16px 0;">
          Verify Your Zarb Account
        </h1>
        <p style="font-size: 14px; line-height: 1.7; color: #d4d4d8; text-align: center; margin-bottom: 20px;">
          ${customerGreeting}<br>
          Please verify your email address to ensure seamless access to your order invoices, delivery tracking, and client concierge services.
        </p>
        ${renderButton('Verify Email Address', actionUrl)}
        <p style="font-size: 12px; color: #71717a; text-align: center; margin-top: 20px;">
          This verification link is valid for 24 hours. If you did not create an account, you may safely disregard this message.
        </p>
      `, 'Please verify your Zarb account email to confirm your client profile.');

      const text = `Verify your Zarb account\n\n${customerGreeting}\n\nPlease verify your email address:\n${actionUrl}\n\nThis link is valid for 24 hours.\n© ${new Date().getFullYear()} Zarb Haute Couture`;
      return { subject, html, text };
    }

    // -----------------------------------------------------------------------
    // 4. PASSWORD RESET
    // -----------------------------------------------------------------------
    case 'password_reset': {
      const subject = 'Reset your Zarb password';
      const html = wrapLayout(`
        <h1 style="font-family: 'Times New Roman', Times, serif, Georgia; font-size: 24px; font-weight: 600; text-align: center; color: #ffffff; margin: 8px 0 16px 0;">
          Reset Your Zarb Password
        </h1>
        <p style="font-size: 14px; line-height: 1.7; color: #d4d4d8; text-align: center; margin-bottom: 20px;">
          ${customerGreeting}<br>
          We received a request to reset your password for your Zarb client account. Click the secure link below to proceed.
        </p>
        ${renderButton('Reset Password', actionUrl)}
        <div style="background-color: #1a1a22; border: 1px solid #332b1f; border-radius: 12px; padding: 14px; margin-top: 24px; font-size: 12px; color: #fbbf24; line-height: 1.5;">
          <strong>Security Notice:</strong> If you did not request this password reset, please ignore this email. Your credentials remain safe and secure.
        </div>
      `, 'Reset your Zarb password securely.');

      const text = `Reset your Zarb password\n\n${customerGreeting}\n\nClick the link below to reset your password:\n${actionUrl}\n\nIf you did not make this request, please ignore this email.\n© ${new Date().getFullYear()} Zarb Haute Couture`;
      return { subject, html, text };
    }

    // -----------------------------------------------------------------------
    // 5. ORDER CONFIRMED
    // -----------------------------------------------------------------------
    case 'order_confirmation': {
      const num = data.orderNumber || 'ZARB';
      const subject = `Order confirmed — Zarb #${num}`;
      const html = wrapLayout(`
        <div style="text-align: center; padding-bottom: 10px;">
          <span style="display: inline-block; background-color: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.3); color: #34d399; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; padding: 5px 14px; border-radius: 9999px;">
            Order Confirmed
          </span>
        </div>
        <h1 style="font-family: 'Times New Roman', Times, serif, Georgia; font-size: 26px; font-weight: 600; text-align: center; color: #ffffff; margin: 10px 0 6px 0;">
          Your Order is Confirmed
        </h1>
        <div style="text-align: center; font-size: 13px; color: #f59e0b; font-weight: 600; letter-spacing: 0.1em; margin-bottom: 18px;">
          REFERENCE #${num}
        </div>
        <p style="font-size: 14px; line-height: 1.7; color: #d4d4d8; text-align: center;">
          ${customerGreeting}<br>
          Thank you for choosing Zarb. Your order has been placed in our atelier registry and is being prepared for tailoring &amp; inspection.
        </p>

        ${renderOrderItems(data.items || [])}
        ${renderOrderTotals(data)}
        ${renderShippingDestination(data.shippingAddress)}

        <div style="margin-top: 24px; text-align: center;">
          <p style="font-size: 13px; color: #a1a1aa; margin-bottom: 16px;">
            Payment: <strong style="color: #ffffff;">${(data.paymentMethod || 'Online').toUpperCase()}</strong> &middot; Status: <strong style="color: #34d399;">CONFIRMED</strong>
          </p>
          ${renderButton('Track Your Order', actionUrl)}
        </div>
      `, `Your Zarb order #${num} is confirmed! Thank you for choosing our haute couture atelier.`);

      const text = `Order confirmed — Zarb #${num}\n\n${customerGreeting}\n\nThank you for choosing Zarb. Your order #${num} is confirmed.\nTotal Amount: ${formatINR(data.totalAmount)}\nTrack Order: ${actionUrl}\n\nClient Concierge: hello@zarb.shop\n© ${new Date().getFullYear()} Zarb Haute Couture`;
      return { subject, html, text };
    }

    // -----------------------------------------------------------------------
    // 6. ORDER PROCESSING
    // -----------------------------------------------------------------------
    case 'order_status_processing':
    case 'order_processing': {
      const num = data.orderNumber || 'ZARB';
      const subject = `We're preparing your Zarb order — #${num}`;
      const html = wrapLayout(`
        <div style="text-align: center; padding-bottom: 10px;">
          <span style="display: inline-block; background-color: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); color: #f59e0b; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; padding: 5px 14px; border-radius: 9999px;">
            Atelier Preparation
          </span>
        </div>
        <h1 style="font-family: 'Times New Roman', Times, serif, Georgia; font-size: 24px; font-weight: 600; text-align: center; color: #ffffff; margin: 10px 0 6px 0;">
          We're Preparing Your Order
        </h1>
        <div style="text-align: center; font-size: 13px; color: #f59e0b; font-weight: 600; letter-spacing: 0.1em; margin-bottom: 18px;">
          ORDER #${num}
        </div>
        <p style="font-size: 14px; line-height: 1.7; color: #d4d4d8; text-align: center;">
          ${customerGreeting}<br>
          Our master tailors and artisans are now inspecting, hand-finishing, and carefully packaging your silhouettes for dispatch.
        </p>

        ${renderOrderItems(data.items || [])}
        ${renderButton('View Order Status', actionUrl)}
      `, `We're preparing your Zarb order #${num} in our atelier.`);

      const text = `We're preparing your Zarb order — #${num}\n\n${customerGreeting}\n\nOur artisans are now preparing your order #${num}.\nTrack Status: ${actionUrl}\n\n© ${new Date().getFullYear()} Zarb Haute Couture`;
      return { subject, html, text };
    }

    // -----------------------------------------------------------------------
    // 7. ORDER SHIPPED / DISPATCHED
    // -----------------------------------------------------------------------
    case 'order_status_shipped':
    case 'order_status_dispatched':
    case 'order_shipped': {
      const num = data.orderNumber || 'ZARB';
      const subject = `Your Zarb order has shipped — #${num} 📦`;
      const html = wrapLayout(`
        <div style="text-align: center; padding-bottom: 10px;">
          <span style="display: inline-block; background-color: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); color: #c084fc; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; padding: 5px 14px; border-radius: 9999px;">
            Dispatched &middot; In Transit
          </span>
        </div>
        <h1 style="font-family: 'Times New Roman', Times, serif, Georgia; font-size: 24px; font-weight: 600; text-align: center; color: #ffffff; margin: 10px 0 6px 0;">
          Your Order Has Shipped
        </h1>
        <div style="text-align: center; font-size: 13px; color: #f59e0b; font-weight: 600; letter-spacing: 0.1em; margin-bottom: 18px;">
          ORDER #${num}
        </div>
        <p style="font-size: 14px; line-height: 1.7; color: #d4d4d8; text-align: center;">
          ${customerGreeting}<br>
          Your package has been dispatched from our atelier under insured transit. It is on its way to your designated destination.
        </p>

        ${data.trackingNumber || data.carrier ? `
        <div style="background-color: #1a1a22; border: 1px solid #3b2d54; border-radius: 14px; padding: 16px 20px; margin: 20px 0; text-align: center;">
          ${data.carrier ? `<div style="font-size: 12px; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.1em;">Carrier: <strong style="color: #ffffff;">${data.carrier}</strong></div>` : ''}
          ${data.trackingNumber ? `<div style="font-size: 14px; color: #c084fc; font-weight: 600; margin-top: 4px; font-family: monospace;">AWB / Tracking: ${data.trackingNumber}</div>` : ''}
          ${data.estimatedDelivery ? `<div style="font-size: 12px; color: #34d399; margin-top: 6px;">Estimated Delivery: ${data.estimatedDelivery}</div>` : ''}
        </div>` : ''}

        ${renderOrderItems(data.items || [])}
        ${renderShippingDestination(data.shippingAddress)}
        ${renderButton('Track Delivery Live', actionUrl)}
      `, `Your Zarb order #${num} has shipped and is on its way.`);

      const text = `Your Zarb order has shipped — #${num}\n\n${customerGreeting}\n\nYour order #${num} is on its way.\n${data.trackingNumber ? `Tracking: ${data.trackingNumber}\n` : ''}Track Order: ${actionUrl}\n\n© ${new Date().getFullYear()} Zarb Haute Couture`;
      return { subject, html, text };
    }

    // -----------------------------------------------------------------------
    // 8. ORDER OUT FOR DELIVERY
    // -----------------------------------------------------------------------
    case 'order_status_out_for_delivery':
    case 'order_out_for_delivery': {
      const num = data.orderNumber || 'ZARB';
      const subject = `Your Zarb order is out for delivery — #${num}`;
      const html = wrapLayout(`
        <div style="text-align: center; padding-bottom: 10px;">
          <span style="display: inline-block; background-color: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); color: #60a5fa; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; padding: 5px 14px; border-radius: 9999px;">
            Out For Delivery Today
          </span>
        </div>
        <h1 style="font-family: 'Times New Roman', Times, serif, Georgia; font-size: 24px; font-weight: 600; text-align: center; color: #ffffff; margin: 10px 0 6px 0;">
          Arriving Today
        </h1>
        <div style="text-align: center; font-size: 13px; color: #f59e0b; font-weight: 600; letter-spacing: 0.1em; margin-bottom: 18px;">
          ORDER #${num}
        </div>
        <p style="font-size: 14px; line-height: 1.7; color: #d4d4d8; text-align: center;">
          ${customerGreeting}<br>
          Your courier is on the final leg of the journey. Please ensure someone is available at your delivery destination to receive the package.
        </p>

        ${renderShippingDestination(data.shippingAddress)}
        ${renderButton('View Order Details', actionUrl)}
      `, `Your Zarb order #${num} is out for delivery today.`);

      const text = `Your Zarb order is out for delivery — #${num}\n\n${customerGreeting}\n\nYour order #${num} is arriving today.\nTrack: ${actionUrl}\n\n© ${new Date().getFullYear()} Zarb Haute Couture`;
      return { subject, html, text };
    }

    // -----------------------------------------------------------------------
    // 9. ORDER DELIVERED
    // -----------------------------------------------------------------------
    case 'order_status_delivered':
    case 'order_delivered': {
      const num = data.orderNumber || 'ZARB';
      const subject = `Your Zarb order has arrived — #${num}`;
      const html = wrapLayout(`
        <div style="text-align: center; padding-bottom: 10px;">
          <span style="display: inline-block; background-color: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.3); color: #34d399; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; padding: 5px 14px; border-radius: 9999px;">
            Delivered
          </span>
        </div>
        <h1 style="font-family: 'Times New Roman', Times, serif, Georgia; font-size: 24px; font-weight: 600; text-align: center; color: #ffffff; margin: 10px 0 6px 0;">
          Your Order Has Been Delivered
        </h1>
        <div style="text-align: center; font-size: 13px; color: #f59e0b; font-weight: 600; letter-spacing: 0.1em; margin-bottom: 18px;">
          ORDER #${num}
        </div>
        <p style="font-size: 14px; line-height: 1.7; color: #d4d4d8; text-align: center;">
          ${customerGreeting}<br>
          We hope you cherish your new silhouettes. Each creation has been tailored to perfection and represents the utmost standard of our atelier.
        </p>

        ${renderOrderItems(data.items || [])}
        ${renderButton('Review & View Invoices', actionUrl)}

        <p style="font-size: 12px; color: #a1a1aa; text-align: center; margin-top: 24px;">
          Need alterations, styling advice, or assistance? Our concierge is at your service at <a href="mailto:hello@zarb.shop" style="color: #f59e0b;">hello@zarb.shop</a>.
        </p>
      `, `Your Zarb order #${num} has been delivered. Enjoy your luxury pieces!`);

      const text = `Your Zarb order has arrived — #${num}\n\n${customerGreeting}\n\nYour order #${num} has been delivered.\nView Order: ${actionUrl}\n\n© ${new Date().getFullYear()} Zarb Haute Couture`;
      return { subject, html, text };
    }

    // -----------------------------------------------------------------------
    // 10. ORDER CANCELLED
    // -----------------------------------------------------------------------
    case 'order_status_cancelled':
    case 'order_cancelled': {
      const num = data.orderNumber || 'ZARB';
      const subject = `Your Zarb order has been cancelled — #${num}`;
      const html = wrapLayout(`
        <div style="text-align: center; padding-bottom: 10px;">
          <span style="display: inline-block; background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; padding: 5px 14px; border-radius: 9999px;">
            Order Cancelled
          </span>
        </div>
        <h1 style="font-family: 'Times New Roman', Times, serif, Georgia; font-size: 24px; font-weight: 600; text-align: center; color: #ffffff; margin: 10px 0 6px 0;">
          Order Cancellation Notice
        </h1>
        <div style="text-align: center; font-size: 13px; color: #f59e0b; font-weight: 600; letter-spacing: 0.1em; margin-bottom: 18px;">
          ORDER #${num}
        </div>
        <p style="font-size: 14px; line-height: 1.7; color: #d4d4d8; text-align: center;">
          ${customerGreeting}<br>
          Your order #${num} has been cancelled${data.cancellationReason ? ` (${data.cancellationReason})` : ''}.
        </p>
        <p style="font-size: 13px; line-height: 1.6; color: #a1a1aa; text-align: center;">
          If payment was already debited, your refund is being initiated to your original payment method.
        </p>

        ${renderOrderItems(data.items || [])}
        ${renderButton('Visit Atelier Store', actionUrl)}
      `, `Your Zarb order #${num} has been cancelled.`);

      const text = `Your Zarb order has been cancelled — #${num}\n\n${customerGreeting}\n\nYour order #${num} has been cancelled.\nIf you have any questions, reach out to hello@zarb.shop\n© ${new Date().getFullYear()} Zarb Haute Couture`;
      return { subject, html, text };
    }

    // -----------------------------------------------------------------------
    // 11. REFUND PROCESSED
    // -----------------------------------------------------------------------
    case 'order_status_refunded':
    case 'refund_processed': {
      const num = data.orderNumber || 'ZARB';
      const subject = `Your Zarb refund has been processed — #${num}`;
      const refundVal = data.refundAmount || data.totalAmount;
      const html = wrapLayout(`
        <div style="text-align: center; padding-bottom: 10px;">
          <span style="display: inline-block; background-color: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.3); color: #34d399; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; padding: 5px 14px; border-radius: 9999px;">
            Refund Completed
          </span>
        </div>
        <h1 style="font-family: 'Times New Roman', Times, serif, Georgia; font-size: 24px; font-weight: 600; text-align: center; color: #ffffff; margin: 10px 0 6px 0;">
          Refund Successfully Processed
        </h1>
        <div style="text-align: center; font-size: 13px; color: #f59e0b; font-weight: 600; letter-spacing: 0.1em; margin-bottom: 18px;">
          ORDER #${num}
        </div>
        <p style="font-size: 14px; line-height: 1.7; color: #d4d4d8; text-align: center;">
          ${customerGreeting}<br>
          A refund of <strong style="color: #34d399; font-size: 16px;">${formatINR(refundVal)}</strong> has been processed for order #${num}.
        </p>
        <p style="font-size: 13px; line-height: 1.6; color: #a1a1aa; text-align: center;">
          Depending on your issuing bank or card provider, funds typically reflect in your account within 3 to 7 business days.
        </p>

        ${renderButton('View Account & Invoices', actionUrl)}
      `, `Your Zarb refund for order #${num} has been processed.`);

      const text = `Your Zarb refund has been processed — #${num}\n\n${customerGreeting}\n\nA refund of ${formatINR(refundVal)} has been processed for order #${num}.\n© ${new Date().getFullYear()} Zarb Haute Couture`;
      return { subject, html, text };
    }

    default: {
      const subject = 'Update regarding your Zarb order';
      const html = wrapLayout(`
        <h1 style="font-family: 'Times New Roman', Times, serif, Georgia; font-size: 24px; font-weight: 600; text-align: center; color: #ffffff;">
          Order Update
        </h1>
        <p style="font-size: 14px; line-height: 1.7; color: #d4d4d8; text-align: center;">
          ${customerGreeting}<br>
          There is an update regarding your order with Zarb.
        </p>
        ${renderButton('View Your Order', actionUrl)}
      `, 'Update regarding your Zarb order.');

      const text = `Update regarding your Zarb order\n\n${customerGreeting}\n\nCheck order: ${actionUrl}\n© ${new Date().getFullYear()} Zarb Haute Couture`;
      return { subject, html, text };
    }
  }
}
