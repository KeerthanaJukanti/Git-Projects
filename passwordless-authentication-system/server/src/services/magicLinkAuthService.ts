import { Request, Response } from 'express';
import createError from 'http-errors';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { transporter, isEmailConfigured } from '../email/emailTransport.js';
import { User } from '../models/User.js';
import { MagicLinkToken } from '../models/MagicLinkToken.js';
import { hashToken, randomToken, setAuthCookies, clearAuthCookies, signAccessToken, signRefreshToken } from '../utils/jwtTokenUtils.js';
import { logger } from '../utils/logger.js';

/**
 * Registers a new user and sends a passwordless authentication link
 * @param userData - User registration data
 * @throws {Error} If registration fails
 */
export async function registerUser(userData: {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}): Promise<void> {
  try {
    // Check if email is properly configured
    if (!isEmailConfigured()) {
      throw createError(500, 'Email server is not configured. Please set EMAIL_USER, EMAIL_PASS, EMAIL_HOST, and EMAIL_PORT in your .env file.');
    }
    
    const normalizedEmail = userData.email.toLowerCase().trim();
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: normalizedEmail },
        { username: userData.username.trim() }
      ]
    });
    
    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        throw createError(400, 'User with this email already exists');
      }
      if (existingUser.username === userData.username.trim()) {
        throw createError(400, 'Username is already taken');
      }
    }

    // Create new user
    const user = await User.create({
      email: normalizedEmail,
      firstName: userData.firstName.trim(),
      lastName: userData.lastName.trim(),
      username: userData.username.trim()
    });

    // Generate secure token
    const token = randomToken();
    const tokenHash = hashToken(token);
    const tokenExpiryMinutes = Number(process.env.TOKEN_EXPIRY_MINUTES) || 15;
    const expiresAt = new Date(Date.now() + (tokenExpiryMinutes * 60 * 1000));
    
    // Store token in database
    await MagicLinkToken.create({ 
      userId: user._id, 
      tokenHash, 
      expiresAt 
    });

    // Send email with verification link
    const apiUrl = process.env.API_URL || 'http://localhost:4000';
    const verifyUrl = `${apiUrl}/auth/passwordless/verify?token=${token}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: process.env.LOGIN_EMAIL_SUBJECT,
      text: `Click to sign in: ${verifyUrl} (valid ${tokenExpiryMinutes} minutes)`,
      html: getLoginEmailTemplate(verifyUrl, tokenExpiryMinutes)
    });
  } catch (error) {
    logger.error('Failed to register user:', error);
    if (error instanceof Error) {
      // Re-throw specific errors
      if (error.message.includes('already exists') || error.message.includes('already taken')) {
        throw error;
      }
      // Provide specific error messages for email issues
      if (error.message.includes('Invalid login') || error.message.includes('authentication failed')) {
        throw createError(500, 'Email server authentication failed. Please check EMAIL_USER and EMAIL_PASS configuration.');
      }
      if (error.message.includes('ECONNREFUSED')) {
        throw createError(500, 'Cannot connect to email server. Please check EMAIL_HOST and EMAIL_PORT configuration.');
      }
      if (error.message.includes('EMAIL_USER') || error.message.includes('EMAIL_PASS')) {
        throw createError(500, 'Email configuration is missing. Please configure EMAIL_USER and EMAIL_PASS in your .env file.');
      }
      throw createError(500, `Failed to create account: ${error.message}`);
    }
    throw createError(500, 'Failed to create account');
  }
}

/**
 * Sends a passwordless authentication link to the user's email
 * @param email - User's email address
 * @throws {Error} If email sending fails
 */
export async function requestPasswordlessLink(email: string): Promise<void> {
  try {
    // Check if email is properly configured
    if (!isEmailConfigured()) {
      throw createError(500, 'Email server is not configured. Please set EMAIL_USER, EMAIL_PASS, EMAIL_HOST, and EMAIL_PORT in your .env file.');
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Find existing user - don't create new ones on login
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      throw createError(404, 'No user found with this email. Please register first.');
    }

    // Generate secure token
    const token = randomToken();
    const tokenHash = hashToken(token);
    const tokenExpiryMinutes = Number(process.env.TOKEN_EXPIRY_MINUTES) || 15;
    const expiresAt = new Date(Date.now() + (tokenExpiryMinutes * 60 * 1000));
    
    // Store token in database
    await MagicLinkToken.create({ 
      userId: user._id, 
      tokenHash, 
      expiresAt 
    });

    // Send email with verification link
    const apiUrl = process.env.API_URL || 'http://localhost:4000';
    const verifyUrl = `${apiUrl}/auth/passwordless/verify?token=${token}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: process.env.LOGIN_EMAIL_SUBJECT,
      text: `Click to sign in: ${verifyUrl} (valid ${tokenExpiryMinutes} minutes)`,
      html: getLoginEmailTemplate(verifyUrl, tokenExpiryMinutes)
    });
  } catch (error) {
    logger.error('Failed to send passwordless link:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      // Check if it's an email configuration error
      if (error.message.includes('Invalid login') || error.message.includes('authentication failed')) {
        throw createError(500, 'Email server authentication failed. Please check EMAIL_USER and EMAIL_PASS configuration.');
      }
      if (error.message.includes('self signed certificate')) {
        throw createError(500, 'Email server SSL certificate error. Please check EMAIL configuration.');
      }
      if (error.message.includes('ECONNREFUSED')) {
        throw createError(500, 'Cannot connect to email server. Please check EMAIL_HOST and EMAIL_PORT configuration.');
      }
      // Check if email credentials are missing
      if (error.message.includes('EMAIL_USER') || error.message.includes('EMAIL_PASS')) {
        throw createError(500, 'Email configuration is missing. Please configure EMAIL_USER and EMAIL_PASS in your .env file.');
      }
      // Re-throw error with original message if it's already an http-error
      if (error.message.includes('No user found')) {
        throw error;
      }
      throw createError(500, `Failed to send authentication link: ${error.message}`);
    }
    
    throw createError(500, 'Failed to send authentication link');
  }
}

/**
 * Verifies a passwordless authentication token and signs in the user
 * @param token - The verification token from the email link
 * @param _req - Express request object (unused)
 * @param res - Express response object
 * @returns Promise<string> - Redirect URL
 * @throws {Error} If token is invalid, expired, or already used
 */
export async function verifyPasswordlessLink(token: string, _req: Request, res: Response): Promise<string> {
  try {
    const tokenHash = hashToken(token);
    const record = await MagicLinkToken.findOne({ tokenHash });

    if (!record) {
      throw createError(400, 'Invalid authentication link');
    }
    
    if (record.usedAt) {
      throw createError(400, 'Authentication link has already been used');
    }
    
    if (record.expiresAt.getTime() < Date.now()) {
      throw createError(400, 'Authentication link has expired');
    }

    const user = await User.findById(record.userId);
    if (!user) {
      throw createError(400, 'User not found');
    }

    // Mark token as used
    record.usedAt = new Date();
    await record.save();

    // Generate new JWT tokens
    const accessToken = signAccessToken(String(user._id));
    const refreshToken = signRefreshToken(String(user._id));
    setAuthCookies(res, accessToken, refreshToken);

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const dashboardPath = process.env.DASHBOARD_PATH || '/dashboard';
    return `${appUrl}${dashboardPath}`;
  } catch (error) {
    logger.error('Token verification failed:', error);
    throw error;
  }
}

/**
 * Refreshes the user's access token using their refresh token
 * @param req - Express request object
 * @param res - Express response object
 * @throws {Error} If refresh token is invalid or expired
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) {
      throw createError(401, 'Refresh token required');
    }

    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET not configured');
    }

    const payload = jwt.verify(token, secret) as JwtPayload;
    const userId = payload.sub as string;
    
    if (!userId) {
      throw createError(401, 'Invalid refresh token payload');
    }

    // Generate new tokens
    const accessToken = signAccessToken(userId);
    const refreshToken = signRefreshToken(userId);
    setAuthCookies(res, accessToken, refreshToken);
  } catch (error) {
    logger.error('Token refresh failed:', error);
    throw createError(401, 'Invalid or expired refresh token');
  }
}

/**
 * Logs out the user by clearing authentication cookies
 * @param _req - Express request object (unused)
 * @param res - Express response object
 */
export async function logout(_req: Request, res: Response): Promise<void> {
  clearAuthCookies(res);
}

/**
 * Clears all users and magic link tokens from the database
 * WARNING: This will delete ALL data permanently
 * @throws {Error} If cleanup fails
 */
export async function clearAllData(): Promise<{ usersDeleted: number; tokensDeleted: number }> {
  try {
    // Delete all magic link tokens first (due to foreign key constraints)
    const tokensResult = await MagicLinkToken.deleteMany({});
    
    // Delete all users
    const usersResult = await User.deleteMany({});
    
    logger.info(`Database cleanup completed: ${usersResult.deletedCount} users and ${tokensResult.deletedCount} tokens deleted`);
    
    return {
      usersDeleted: usersResult.deletedCount,
      tokensDeleted: tokensResult.deletedCount
    };
  } catch (error) {
    logger.error('Failed to clear database:', error);
    throw createError(500, 'Failed to clear database');
  }
}


/**
 * Generates login email HTML template
 * @param verifyUrl - Verification URL
 * @param tokenExpiryMinutes - Token expiry in minutes
 * @returns HTML email template
 */
function getLoginEmailTemplate(verifyUrl: string, tokenExpiryMinutes: number): string {
  const appName = process.env.APP_NAME;
  const primaryColor = process.env.EMAIL_PRIMARY_COLOR;
  const companyName = process.env.COMPANY_NAME;
  const fontFamily = process.env.EMAIL_FONT_FAMILY;
  const maxWidth = process.env.EMAIL_MAX_WIDTH;
  const containerPadding = process.env.EMAIL_CONTAINER_PADDING;
  const buttonPadding = process.env.EMAIL_BUTTON_PADDING;
  const buttonRadius = process.env.EMAIL_BUTTON_RADIUS;
  const buttonFontSize = process.env.EMAIL_BUTTON_FONT_SIZE;
  const textColor = process.env.EMAIL_TEXT_COLOR;
  const headingColor = process.env.EMAIL_HEADING_COLOR;
  const lightBgColor = process.env.EMAIL_LIGHT_BG_COLOR;
  const warningBgColor = process.env.EMAIL_WARNING_BG_COLOR;
  const warningTextColor = process.env.EMAIL_WARNING_TEXT_COLOR;
  const borderColor = process.env.EMAIL_BORDER_COLOR;
  const sectionMargin = process.env.EMAIL_SECTION_MARGIN;
  const borderRadius = process.env.EMAIL_BORDER_RADIUS;
  const warningPadding = process.env.EMAIL_WARNING_PADDING;
  const warningFontSize = process.env.EMAIL_WARNING_FONT_SIZE;
  const lineHeight = process.env.EMAIL_LINE_HEIGHT;
  
  return `
    <div style="font-family: ${fontFamily}; max-width: ${maxWidth}; margin: 0 auto; padding: ${containerPadding};">
      <div style="text-align: center; margin-bottom: ${sectionMargin};">
        <h1 style="color: ${primaryColor}; margin: 0;">Sign in to ${appName}</h1>
      </div>
      
      <div style="padding: ${containerPadding}; margin-bottom: 20px;">
        <h2 style="margin-top: 0; color: ${headingColor};">Hello!</h2>
        <p style="color: ${textColor}; line-height: ${lineHeight};">
          You requested a passwordless login for your dashboard.
        </p>
        <p style="color: ${textColor}; line-height: ${lineHeight};">
          Click the button below to securely sign in to your account:
        </p>
      </div>
      
      <div style="text-align: center; margin: ${sectionMargin} 0;">
        <a href="${verifyUrl}" 
           style="display: inline-block; padding: ${buttonPadding}; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: ${buttonRadius}; font-weight: 600; font-size: ${buttonFontSize}; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
          Sign In Now
        </a>
      </div>
      
      <div style="background-color: ${warningBgColor}; padding: ${warningPadding}; border-radius: ${buttonRadius}; margin: 20px 0;">
        <p style="margin: 0; color: ${warningTextColor}; font-size: ${warningFontSize};">
          <strong>Security Note:</strong> This link is valid for ${tokenExpiryMinutes} minutes and can only be used once.
        </p>
      </div>
      
      <div style="border-top: 1px solid ${borderColor}; padding-top: ${containerPadding}; margin-top: ${sectionMargin};">
        <p style="color: ${warningTextColor}; font-size: ${warningFontSize}; margin: 0;">
          If you didn't request this sign-in link, please ignore this email. Your account remains secure.
        </p>
        <p style="color: ${warningTextColor}; font-size: ${warningFontSize}; margin: 10px 0 0 0;">
          For security questions, please contact our support team.
        </p>
      </div>
    </div>
  `;
}
