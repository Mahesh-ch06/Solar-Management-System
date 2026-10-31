import emailjs from '@emailjs/browser';

/**
 * EmailJS Configuration derived from environment variables
 */
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

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
};
