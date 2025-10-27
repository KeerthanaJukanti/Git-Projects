import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

// Dynamic email configuration
const emailConfig = {
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates for Gmail
    ciphers: 'SSLv3'
  }
};

// Validate required email configuration
if (!emailConfig.auth.user || !emailConfig.auth.pass) {
  logger.error('EMAIL_USER and EMAIL_PASS are required for email functionality');
  logger.error('Please configure these environment variables in your .env file:');
  logger.error('  EMAIL_USER=your-email@gmail.com');
  logger.error('  EMAIL_PASS=your-app-password');
}

export const transporter = nodemailer.createTransport(emailConfig);

/**
 * Check if email is properly configured
 * @returns boolean indicating if email is ready to send
 */
export function isEmailConfigured(): boolean {
  return !!(emailConfig.auth.user && emailConfig.auth.pass && emailConfig.host && emailConfig.port);
}

// Test email configuration on startup
transporter.verify((error, success) => {
  if (error) {
    logger.error('Email configuration error:', error);
  } else {
    logger.success('Email server is ready to send messages');
  }
});
