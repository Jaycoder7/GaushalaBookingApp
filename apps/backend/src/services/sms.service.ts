// SMS Service - Placeholder for future integration
// Supports: Twilio, Vonage/Nexmo, AWS SNS

interface SMSPayload {
  to: string;
  message: string;
}

export async function sendSMS({ to, message }: SMSPayload) {
  const provider = process.env.SMS_PROVIDER || 'stub';
  
  try {
    if (provider === 'stub') {
      // Stub implementation - no-op
      console.log(`[SMS STUB] To: ${to}, Message: ${message}`);
      return { success: true, provider: 'stub' };
    }
    
    // TODO: Add provider-specific implementations
    // if (provider === 'twilio') { ... }
    // if (provider === 'vonage') { ... }
    // if (provider === 'aws') { ... }
    
    throw new Error(`SMS provider '${provider}' not implemented`);
  } catch (error) {
    console.error('SMS send failed:', error);
    throw error;
  }
}
