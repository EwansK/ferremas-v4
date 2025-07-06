const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

class JWTUtils {
  constructor() {
    this.accessTokenSecret = process.env.JWT_SECRET;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
    this.accessTokenExpiry = process.env.JWT_EXPIRES_IN || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    
    // Database connection for session management
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  generateAccessToken(payload) {
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry
    });
  }

  generateRefreshToken(payload) {
    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry
    });
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.accessTokenSecret);
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshTokenSecret);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async generateTokenPair(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role_id: user.role_id,
      role: user.role_name,
      name: user.name,
      lastname: user.lastname
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken({ id: user.id });

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await this.pool.query(
      `INSERT INTO user_sessions (user_id, refresh_token, expires_at) 
       VALUES ($1, $2, $3)`,
      [user.id, refreshToken, expiresAt]
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenExpiry
    };
  }

  async refreshAccessToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = this.verifyRefreshToken(refreshToken);
      
      // Check if refresh token exists in database and is not expired
      const sessionResult = await this.pool.query(
        `SELECT us.*, u.id, u.email, u.name, u.lastname, u.role_id, u.active, r.role_name
         FROM user_sessions us
         JOIN users u ON us.user_id = u.id
         JOIN roles r ON u.role_id = r.id
         WHERE us.refresh_token = $1 AND us.expires_at > NOW()`,
        [refreshToken]
      );

      if (sessionResult.rows.length === 0) {
        throw new Error('Invalid or expired refresh token');
      }

      const user = sessionResult.rows[0];

      if (!user.active) {
        throw new Error('User account is inactive');
      }

      // Generate new access token
      const payload = {
        id: user.id,
        email: user.email,
        role_id: user.role_id,
        role: user.role_name,
        name: user.name,
        lastname: user.lastname
      };

      const newAccessToken = this.generateAccessToken(payload);

      return {
        accessToken: newAccessToken,
        expiresIn: this.accessTokenExpiry
      };

    } catch (error) {
      throw new Error('Failed to refresh token: ' + error.message);
    }
  }

  async invalidateRefreshToken(refreshToken) {
    try {
      await this.pool.query(
        'DELETE FROM user_sessions WHERE refresh_token = $1',
        [refreshToken]
      );
      return true;
    } catch (error) {
      console.error('Error invalidating refresh token:', error);
      return false;
    }
  }

  async invalidateAllUserTokens(userId) {
    try {
      await this.pool.query(
        'DELETE FROM user_sessions WHERE user_id = $1',
        [userId]
      );
      return true;
    } catch (error) {
      console.error('Error invalidating user tokens:', error);
      return false;
    }
  }

  async cleanupExpiredTokens() {
    try {
      const result = await this.pool.query(
        'DELETE FROM user_sessions WHERE expires_at <= NOW()'
      );
      console.log(`Cleaned up ${result.rowCount} expired tokens`);
      return result.rowCount;
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      return 0;
    }
  }

  extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new Error('Invalid authorization header format');
    }

    return parts[1];
  }
}

module.exports = new JWTUtils();