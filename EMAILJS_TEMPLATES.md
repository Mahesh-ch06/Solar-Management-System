# ✉️ EmailJS HTML Templates for SunPower Solutions

This document contains pre-designed, responsive, and cross-client compatible HTML templates for your **EmailJS** dashboard ([https://dashboard.emailjs.com/admin/templates](https://dashboard.emailjs.com/admin/templates)).

---

## 🚀 Setup Instructions in EmailJS Dashboard

1. Log in to [EmailJS Dashboard](https://dashboard.emailjs.com/).
2. Navigate to **Email Services** → Add / verify your Email Service (e.g. Gmail, SendGrid, SMTP) → Copy your **Service ID**.
3. Navigate to **Email Templates** → Click **Create New Template**.
4. Configure the Header settings:
   - **To Email**: `{{to_email}}`
   - **From Name**: `SunPower Solutions`
   - **Subject**: `{{subject}}`
5. Switch to the **Content** tab, click **`< > Source Code`** or paste into the HTML editor.
6. Copy & paste one of the templates below and click **Save**.
7. Copy the **Template ID** and add it along with your **Public Key** to `/home/mahesh/Documents/Oddo/.env`:
   ```env
   VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
   VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
   VITE_EMAILJS_PUBLIC_KEY=your_public_key_xxxx
   ```

---

## 🌟 Template 1: Master Universal Template (Recommended)
> **Best for all emails**: Works automatically for Customer Invoices, Warranty Certificates, Step Tracking Updates, and Admin Role notifications!

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Container Card -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 50%, #fed7aa 100%); padding: 28px 32px; border-bottom: 2px solid #fde68a;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background-color: #f59e0b; color: #020617; font-size: 22px; width: 44px; height: 44px; line-height: 44px; text-align: center; border-radius: 12px; font-weight: bold; margin-bottom: 8px;">
                      ☀️
                    </div>
                    <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
                      SunPower Solutions
                    </h1>
                    <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: 700; color: #b45309; text-transform: uppercase; letter-spacing: 0.08em;">
                      Rooftop Solar & Engineering ERP
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px;">
              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 700; color: #0f172a;">
                Hello {{to_name}},
              </p>

              <!-- Message Body -->
              <div style="font-size: 14px; line-height: 1.65; color: #334155; white-space: pre-wrap; margin-bottom: 28px; background-color: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
{{message}}
              </div>

              <!-- Call to Action Button -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #f59e0b;">
                    <a href="{{action_url}}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: 700; color: #020617; text-decoration: none; border-radius: 10px; background-color: #f59e0b; border: 1px solid #d97706; text-align: center;">
                      {{action_label}} &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <p style="margin: 24px 0 0 0; font-size: 12px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                🔒 This is an automated transactional notification sent from SunPower Solutions ERP. If you have inquiries regarding your solar project or warranty, please contact customer care directly.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #475569;">
                SunPower Solutions Clean Energy Infrastructure Pvt. Ltd.
              </p>
              <p style="margin: 0 0 8px 0; font-size: 11px; color: #64748b;">
                Toll Free: <strong>+91 98101 23456</strong> &bull; Support: <strong>support@sunpowersolutions.in</strong>
              </p>
              <p style="margin: 0; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">
                ISO 9001:2015 Certified &bull; PM Surya Ghar Registered Rooftop Vendor
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 📜 Template 2: Dedicated Warranty Certificate Template
> Designed as an official Solar Equipment Limited Warranty Credential.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Warranty Certificate</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif; color:#0f172a;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background:#ffffff; border-radius:16px; border:2px solid #f59e0b; box-shadow: 0 4px 16px rgba(245,158,11,0.12); overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #fffbeb, #fef3c7); padding: 24px; text-align: center; border-bottom: 1px solid #fde68a;">
              <span style="font-size: 32px;">🛡️</span>
              <h2 style="margin: 6px 0 2px 0; font-size: 20px; font-weight: 800; color: #78350f;">
                OFFICIAL WARRANTY CERTIFICATE
              </h2>
              <p style="margin:0; font-size:11px; font-weight:700; color:#b45309; text-transform:uppercase; letter-spacing:0.1em;">
                SunPower Solutions OEM Limited Warranty SLA
              </p>
            </td>
          </tr>

          <!-- Certificate Details -->
          <tr>
            <td style="padding: 28px;">
              <p style="margin:0 0 12px 0; font-size:15px; font-weight:700; color:#0f172a;">
                Issued to: <span style="color:#d97706;">{{to_name}}</span>
              </p>

              <!-- Hardware UID Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 16px;">
                    <span style="font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.08em; display:block;">
                      Component Hardware Serial (UID)
                    </span>
                    <span style="font-size: 18px; font-weight:800; color:#b45309; font-family:monospace; display:block; margin: 4px 0 8px 0;">
                      {{serial_number}}
                    </span>
                    <span style="font-size:13px; font-weight:600; color:#334155;">
                      Equipment: {{item_name}}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Details Box -->
              <div style="font-size: 13px; line-height: 1.6; color: #475569; background:#fffbeb; padding: 16px; border-radius: 10px; border: 1px solid #fef3c7; white-space: pre-wrap; margin-bottom: 24px;">
{{message}}
              </div>

              <!-- Button -->
              <div style="text-align:center;">
                <a href="{{action_url}}" target="_blank" style="display:inline-block; padding: 12px 28px; background-color:#f59e0b; color:#020617; font-weight:700; font-size:14px; text-decoration:none; border-radius:8px;">
                  {{action_label}}
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc; padding: 18px; text-align:center; border-top:1px solid #e2e8f0; font-size:11px; color:#64748b;">
              Support Helpline: +91 98101 23456 &bull; support@sunpowersolutions.in
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 🧾 Template 3: Dedicated Customer Invoice Template
> Formatted as a professional billing statement with payment breakdown.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Customer Project Invoice</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif; color:#0f172a;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background:#ffffff; border-radius:16px; border:1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.04); overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background:#0f172a; padding: 24px 30px; color:#ffffff;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <h2 style="margin:0; font-size: 18px; font-weight:800; color:#ffffff;">SunPower Solutions</h2>
                    <span style="font-size: 11px; color:#f59e0b; font-weight:700; text-transform:uppercase;">Invoice & Billing Statement</span>
                  </td>
                  <td align="right">
                    <span style="font-size: 10px; color:#94a3b8; text-transform:uppercase; display:block;">Invoice Reference</span>
                    <span style="font-size: 14px; font-weight:700; color:#ffffff; font-family:monospace;">{{invoice_number}}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Invoice Details -->
          <tr>
            <td style="padding: 28px 30px;">
              <p style="margin:0 0 16px 0; font-size:15px; font-weight:700; color:#0f172a;">
                Billed To: <span style="color:#d97706;">{{to_name}}</span>
              </p>

              <!-- Financial Summary Table -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0; border-radius:10px; margin-bottom: 20px; font-size:13px; overflow:hidden;">
                <tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-weight:700; color:#475569;">Description</td>
                  <td align="right" style="padding: 10px 14px; font-weight:700; color:#475569;">Amount</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-top:1px solid #f1f5f9; color:#334155;">Total Solar Project Cost</td>
                  <td align="right" style="padding: 10px 14px; border-top:1px solid #f1f5f9; font-weight:700; color:#0f172a;">{{total_amount}}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-top:1px solid #f1f5f9; color:#334155;">Outstanding Balance Due</td>
                  <td align="right" style="padding: 10px 14px; border-top:1px solid #f1f5f9; font-weight:800; color:#b45309; font-size:15px;">{{balance_due}}</td>
                </tr>
              </table>

              <!-- Detailed Itemization -->
              <div style="font-size: 13px; line-height: 1.6; color:#475569; background:#f8fafc; padding: 16px; border-radius:10px; border:1px solid #e2e8f0; white-space: pre-wrap; margin-bottom: 24px;">
{{message}}
              </div>

              <!-- Button -->
              <div style="text-align:center;">
                <a href="{{action_url}}" target="_blank" style="display:inline-block; padding: 12px 28px; background-color:#f59e0b; color:#020617; font-weight:700; font-size:14px; text-decoration:none; border-radius:8px;">
                  {{action_label}}
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc; padding: 18px 30px; text-align:center; border-top:1px solid #e2e8f0; font-size:11px; color:#64748b;">
              Have questions regarding subsidy or payment? Call +91 98101 23456 &bull; support@sunpowersolutions.in
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 📍 Template 4: Step-by-Step Project Milestone Tracker
> Dispatched at each milestone: Inquiry &rarr; Survey &rarr; Quotation &rarr; DISCOM &rarr; Installation &rarr; Commissioning.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Solar Project Milestone</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,sans-serif; color:#0f172a;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background:#ffffff; border-radius:16px; border:1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.04); overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a, #1e293b); padding: 24px 30px; color:#ffffff;">
              <span style="display:inline-block; padding: 3px 10px; background:#f59e0b; color:#020617; border-radius:20px; font-size:10px; font-weight:800; text-transform:uppercase; margin-bottom:8px;">
                PROJECT MILESTONE STEP {{step_index}} OF 6
              </span>
              <h2 style="margin:0; font-size: 19px; font-weight:800; color:#ffffff;">
                {{step_title}}
              </h2>
            </td>
          </tr>

          <!-- Progress Details -->
          <tr>
            <td style="padding: 28px 30px;">
              <p style="margin:0 0 16px 0; font-size:15px; font-weight:700; color:#0f172a;">
                Dear {{to_name}},
              </p>

              <div style="font-size: 13px; line-height: 1.6; color:#334155; background:#f8fafc; padding: 18px; border-radius:10px; border:1px solid #e2e8f0; white-space: pre-wrap; margin-bottom: 24px;">
{{message}}
              </div>

              <!-- Button -->
              <div style="text-align:center;">
                <a href="{{action_url}}" target="_blank" style="display:inline-block; padding: 12px 28px; background-color:#f59e0b; color:#020617; font-weight:700; font-size:14px; text-decoration:none; border-radius:8px;">
                  {{action_label}}
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc; padding: 18px 30px; text-align:center; border-top:1px solid #e2e8f0; font-size:11px; color:#64748b;">
              SunPower Solutions &bull; Live Customer Tracker Desk &bull; +91 98101 23456
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```
