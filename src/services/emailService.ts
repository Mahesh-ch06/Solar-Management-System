import emailjs from '@emailjs/browser';

/**
 * EmailJS Configuration derived from environment variables
 */
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_yhbkafs';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_q772yg3';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '8WPyhdAMux9m4jd4H';

// In-memory rate limiting tracker (prevents duplicate triggers within 15 seconds)
const sentTimestamps: Record<string, number> = {};
const RATE_LIMIT_WINDOW_MS = 15000;

export interface EmailNotificationPayload {
  to_name: string;
  to_email: string;
  subject: string;
  message: string;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, string>;
}

export interface EmailSendResult {
  success: boolean;
  message: string;
  isSimulatedFallback?: boolean;
}

/**
 * Checks if rate limiting allows sending to this recipient for this action
 */
function isRateLimited(key: string): boolean {
  const now = Date.now();
  const lastSent = sentTimestamps[key] || 0;
  if (now - lastSent < RATE_LIMIT_WINDOW_MS) {
    return true;
  }
  sentTimestamps[key] = now;
  return false;
}

/**
 * Generic email notification sender with robust fallback
 */
export async function sendEmailNotification(
  payload: EmailNotificationPayload
): Promise<EmailSendResult> {
  const throttleKey = `${payload.to_email}:${payload.subject}`;

  if (isRateLimited(throttleKey)) {
    console.warn(`[EmailService] Throttled duplicate notification to ${payload.to_email}`);
    return {
      success: true,
      message: 'Notification skipped due to rate limiting (recently dispatched)',
      isSimulatedFallback: true,
    };
  }

  // Check if real EmailJS credentials are configured
  const isConfigured = Boolean(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);

  if (!isConfigured) {
    // Graceful developer & local preview fallback
    console.info(
      `[EmailService: Simulated Dispatch] To: ${payload.to_email} | Subject: "${payload.subject}"\n` +
      `Message:\n${payload.message}\n` +
      `(Note: Configure VITE_EMAILJS_* keys in .env to send via live EmailJS server)`
    );

    return {
      success: true,
      message: 'Email queued successfully (simulated mode, credentials unconfigured)',
      isSimulatedFallback: true,
    };
  }

  try {
    const templateParams = {
      to_name: payload.to_name,
      to_email: payload.to_email,
      subject: payload.subject,
      message: payload.message,
      action_url: payload.action_url || window.location.origin,
      action_label: payload.action_label || 'View in SunPower ERP',
      ...payload.metadata,
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    return {
      success: true,
      message: `Email delivered successfully (Status ${response.status})`,
      isSimulatedFallback: false,
    };
  } catch (error: unknown) {
    // Non-blocking error handling: Log error, but don't crash or halt calling business workflow
    console.error('[EmailService] Failed to dispatch via EmailJS:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown EmailJS dispatch failure',
      isSimulatedFallback: false,
    };
  }
}

/**
 * Specific transactional notifications
 */
export const emailService = {
  /**
   * Dispatched when an administrator changes or assigns a staff role
   */
  async notifyRoleAssigned(
    toEmail: string,
    userName: string,
    oldRole: string,
    newRole: string,
    assignedByAdmin: string,
    reason: string
  ): Promise<EmailSendResult> {
    return sendEmailNotification({
      to_email: toEmail,
      to_name: userName,
      subject: `Role Updated: You have been assigned the role of ${newRole}`,
      message:
        `Hello ${userName},\n\n` +
        `Your user role in SunPower Solutions ERP has been updated from ${oldRole} to ${newRole} ` +
        `by System Administrator ${assignedByAdmin}.\n\n` +
        `Reason for update:\n"${reason}"\n\n` +
        `Please sign in to access your newly authorized features and dashboard.`,
      action_url: `${window.location.origin}/login`,
      action_label: 'Sign In to SunPower ERP',
      metadata: {
        old_role: oldRole,
        new_role: newRole,
        assigned_by: assignedByAdmin,
      },
    });
  },

  /**
   * Dispatched when a new staff member registers (alert to Admin)
   */
  async notifyAdminNewRegistration(
    adminEmail: string,
    newStaffName: string,
    newStaffEmail: string,
    department?: string
  ): Promise<EmailSendResult> {
    return sendEmailNotification({
      to_email: adminEmail,
      to_name: 'Administrator',
      subject: `New Staff Account Pending Approval: ${newStaffName}`,
      message:
        `A new employee registration has been submitted for SunPower Solutions ERP.\n\n` +
        `Name: ${newStaffName}\n` +
        `Email: ${newStaffEmail}\n` +
        `Department: ${department || 'General Staff'}\n\n` +
        `Please log in to the Administrator Portal to review the application, activate the account, and assign an appropriate role.`,
      action_url: `${window.location.origin}/admin/users`,
      action_label: 'Review in User Management',
    });
  },

  /**
   * Dispatched when an administrator approves a staff account
   */
  async notifyAccountApproval(
    toEmail: string,
    userName: string,
    assignedRole: string
  ): Promise<EmailSendResult> {
    return sendEmailNotification({
      to_email: toEmail,
      to_name: userName,
      subject: `Account Approved: Welcome to SunPower Solutions ERP`,
      message:
        `Hello ${userName},\n\n` +
        `Your staff account has been approved and activated with the role of ${assignedRole}.\n\n` +
        `You can now log in using your registered credentials.`,
      action_url: `${window.location.origin}/login`,
      action_label: 'Log In Now',
    });
  },

  /**
   * Dispatched when an official customer invoice is generated or sent
   */
  async notifyCustomerInvoice(
    payload: {
      toEmail: string;
      customerName: string;
      invoiceNumber: string;
      orderNumber?: string;
      capacityKW: number;
      systemType?: string;
      totalAmount: number;
      advancePaid: number;
      balanceDue: number;
      subsidyAmount?: number;
      paymentStatus?: string;
    }
  ): Promise<EmailSendResult> {
    const formattedTotal = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(payload.totalAmount);
    const formattedAdvance = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(payload.advancePaid);
    const formattedBalance = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(payload.balanceDue);
    const formattedSubsidy = payload.subsidyAmount 
      ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(payload.subsidyAmount)
      : '₹0';

    return sendEmailNotification({
      to_email: payload.toEmail,
      to_name: payload.customerName,
      subject: `Invoice & Billing Confirmation: ${payload.invoiceNumber} - SunPower Rooftop Solar`,
      message:
        `Dear ${payload.customerName},\n\n` +
        `Thank you for choosing SunPower Solutions for your clean solar rooftop energy system. Here is your project invoice statement:\n\n` +
        `-----------------------------------------\n` +
        `INVOICE SUMMARY: ${payload.invoiceNumber}\n` +
        `-----------------------------------------\n` +
        `• Order Reference: ${payload.orderNumber || payload.invoiceNumber}\n` +
        `• System Capacity: ${payload.capacityKW} kW (${payload.systemType === 'OFF_GRID' ? 'Hybrid / Off-Grid' : 'Grid-Tied'})\n` +
        `• Total Project Cost: ${formattedTotal}\n` +
        `• PM Surya Ghar Central Subsidy: ${formattedSubsidy}\n` +
        `• Advance Received: ${formattedAdvance}\n` +
        `• Outstanding Balance Due: ${formattedBalance}\n` +
        `• Payment Status: ${payload.paymentStatus || (payload.balanceDue <= 0 ? 'PAID IN FULL' : 'PARTIALLY PAID')}\n\n` +
        `You can monitor your project milestones and live DISCOM subsidy approvals via your Customer Tracking Portal.`,
      action_url: `${window.location.origin}/track?ref=${encodeURIComponent(payload.orderNumber || payload.invoiceNumber)}`,
      action_label: 'View Project Tracker & Invoice',
      metadata: {
        invoice_number: payload.invoiceNumber,
        total_amount: formattedTotal,
        balance_due: formattedBalance,
      },
    });
  },

  /**
   * Dispatched when advance payment is collected for a customer lead
   */
  async notifyAdvancePaymentReceived(payload: {
    toEmail: string;
    customerName: string;
    advanceAmount: number;
    totalAmount?: number;
    totalProjectCost?: number;
    referenceId?: string;
    bookingReference?: string;
    paymentMode?: string;
    paymentMethod?: string;
    receiptNumber?: string;
    transactionId?: string;
    subsidyAmount?: number;
    nextMilestoneTitle?: string;
    capacityKW?: number;
  }): Promise<EmailSendResult> {
    const total = payload.totalProjectCost ?? payload.totalAmount ?? (payload.capacityKW ? payload.capacityKW * 75000 : 225000);
    const refId = payload.bookingReference ?? payload.referenceId ?? `ADV-${Date.now().toString().slice(-6)}`;
    const method = payload.paymentMethod ?? payload.paymentMode ?? 'UPI / Net Banking';

    const formattedAdvance = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(payload.advanceAmount);
    const formattedTotal = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(total);
    const balanceDue = Math.max(0, total - payload.advanceAmount - (payload.subsidyAmount || 0));
    const formattedBalance = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(balanceDue);

    return sendEmailNotification({
      to_email: payload.toEmail,
      to_name: payload.customerName,
      subject: `Advance Payment Receipt: ${formattedAdvance} - SunPower Rooftop Solar`,
      message:
        `Dear ${payload.customerName},\n\n` +
        `We have received your advance project booking payment of ${formattedAdvance} for your solar rooftop installation!\n\n` +
        `-----------------------------------------\n` +
        `ADVANCE PAYMENT RECEIPT\n` +
        `-----------------------------------------\n` +
        `• Booking Reference: ${refId}\n` +
        `• Receipt Number: ${payload.receiptNumber || 'REC-ADV-' + Date.now().toString().slice(-6)}\n` +
        `• Advance Received: ${formattedAdvance}\n` +
        `• Payment Method: ${method}\n` +
        `• Total Project Cost: ${formattedTotal}\n` +
        `• Remaining Balance Due: ${formattedBalance}\n` +
        (payload.nextMilestoneTitle ? `• Next Action: ${payload.nextMilestoneTitle}\n\n` : '\n') +
        `Your engineering procurement and DISCOM feasibility filing are now prioritized. View live status anytime on your Customer Portal:`,
      action_url: `${window.location.origin}/portal?phone=${encodeURIComponent(payload.toEmail)}`,
      action_label: 'View Live Portal & Tracker',
      metadata: {
        receipt_amount: formattedAdvance,
        reference_id: refId,
      },
    });
  },

  /**
   * Dispatched when equipment is dispatched or customer requests digital warranty certificate
   */
  async notifyWarrantyCertificate(
    payload: {
      toEmail: string;
      customerName: string;
      serialNumber: string;
      itemName: string;
      itemCategory?: string;
      brand: string;
      model: string;
      warrantyYears: number;
      warrantyExpiryDate: string;
      dispatchDate: string;
      status: string;
    }
  ): Promise<EmailSendResult> {
    return sendEmailNotification({
      to_email: payload.toEmail,
      to_name: payload.customerName,
      subject: `Official Warranty Certificate: ${payload.itemName} [SN: ${payload.serialNumber}]`,
      message:
        `Dear ${payload.customerName},\n\n` +
        `We hereby certify that your solar equipment is formally covered under SunPower OEM Warranty and Service Level Agreement:\n\n` +
        `-----------------------------------------\n` +
        `WARRANTY CERTIFICATE & HARDWARE UID\n` +
        `-----------------------------------------\n` +
        `• Equipment: ${payload.itemName}\n` +
        `• Brand / Model: ${payload.brand} • ${payload.model}\n` +
        `• Unique Serial Number (UID): ${payload.serialNumber}\n` +
        `• Warranty Duration: ${payload.warrantyYears} Years OEM Replacement Guarantee\n` +
        `• Dispatch Date: ${payload.dispatchDate}\n` +
        `• Coverage Expiry: ${payload.warrantyExpiryDate}\n` +
        `• Current Status: ${payload.status}\n\n` +
        `Please preserve your Hardware UID for future servicing, preventive maintenance, and warranty claims.\n\n` +
        `Customer Care: +91 98101 23456 | support@sunpowersolutions.in`,
      action_url: `${window.location.origin}/warranties?serial=${encodeURIComponent(payload.serialNumber)}`,
      action_label: 'Verify Warranty Certificate',
      metadata: {
        serial_number: payload.serialNumber,
        item_name: payload.itemName,
        expiry_date: payload.warrantyExpiryDate,
      },
    });
  },

  /**
   * Dispatched at each milestone stage in project tracking
   */
  async notifyTrackingStageUpdate(
    payload: {
      toEmail: string;
      customerName: string;
      stepTitle: string;
      stepIndex: number;
      totalSteps: number;
      description: string;
      referenceId: string;
      nextMilestone?: string;
    }
  ): Promise<EmailSendResult> {
    return sendEmailNotification({
      to_email: payload.toEmail,
      to_name: payload.customerName,
      subject: `Project Update [Step ${payload.stepIndex} of ${payload.totalSteps}]: ${payload.stepTitle}`,
      message:
        `Dear ${payload.customerName},\n\n` +
        `Your SunPower Rooftop Solar installation project has completed a new milestone!\n\n` +
        `-----------------------------------------\n` +
        `LIVE PROJECT MILESTONE\n` +
        `-----------------------------------------\n` +
        `• Application Reference: ${payload.referenceId}\n` +
        `• Current Milestone: Step ${payload.stepIndex}/${payload.totalSteps} - ${payload.stepTitle}\n` +
        `• Milestone Details: ${payload.description}\n` +
        (payload.nextMilestone ? `• Next Action: ${payload.nextMilestone}\n\n` : '\n') +
        `Track live photos, technical survey reports, and net meter approvals directly on your Customer Portal:`,
      action_url: `${window.location.origin}/track?ref=${encodeURIComponent(payload.referenceId)}`,
      action_label: 'Open Live Solar Tracker',
      metadata: {
        step_title: payload.stepTitle,
        step_index: String(payload.stepIndex),
        reference_id: payload.referenceId,
      },
    });
  },
};
