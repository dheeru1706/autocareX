'use strict';

const twilio = require('twilio');
const logger = require('./logger');

let twilioClient = null;

function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

/**
 * Send an OTP SMS via Twilio
 */
async function sendOTP(phone, otp) {
  const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
  const message = `Your AutoCareX OTP is ${otp}. Valid for 10 minutes. Do not share with anyone. - AutoCareX`;

  // In development mode, skip actual SMS
  if (process.env.NODE_ENV === 'development' || process.env.SKIP_SMS === 'true') {
    logger.info('SMS skipped (development mode)', { phone: formattedPhone, otp });
    return { sid: 'dev-mode', status: 'queued' };
  }

  try {
    const client = getTwilioClient();
    let result;

    // Use Twilio Verify service if configured
    if (process.env.TWILIO_VERIFY_SERVICE_SID) {
      result = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({ to: formattedPhone, channel: 'sms' });

      logger.info('OTP sent via Twilio Verify', { phone: formattedPhone, sid: result.sid });
      return { sid: result.sid, status: result.status };
    }

    // Fallback: send via Twilio SMS
    result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    logger.info('OTP SMS sent', { phone: formattedPhone, sid: result.sid, status: result.status });
    return { sid: result.sid, status: result.status };
  } catch (err) {
    logger.error('Failed to send OTP SMS', { phone: formattedPhone, error: err.message });
    throw new Error('Failed to send OTP. Please try again.');
  }
}

/**
 * Verify OTP via Twilio Verify service (optional)
 */
async function verifyTwilioOTP(phone, otp) {
  if (!process.env.TWILIO_VERIFY_SERVICE_SID) {
    throw new Error('Twilio Verify service not configured');
  }

  const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

  try {
    const client = getTwilioClient();
    const result = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: formattedPhone, code: otp });

    return result.status === 'approved';
  } catch (err) {
    logger.error('Twilio OTP verification failed', { phone: formattedPhone, error: err.message });
    return false;
  }
}

/**
 * Send a general SMS
 */
async function sendSMS(phone, message) {
  const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

  if (process.env.NODE_ENV === 'development' || process.env.SKIP_SMS === 'true') {
    logger.info('SMS skipped (development mode)', { phone: formattedPhone, message });
    return { sid: 'dev-mode', status: 'queued' };
  }

  try {
    const client = getTwilioClient();
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    logger.info('SMS sent', { phone: formattedPhone, sid: result.sid });
    return { sid: result.sid, status: result.status };
  } catch (err) {
    logger.error('Failed to send SMS', { phone: formattedPhone, error: err.message });
    throw new Error('Failed to send SMS');
  }
}

module.exports = { sendOTP, verifyTwilioOTP, sendSMS };
