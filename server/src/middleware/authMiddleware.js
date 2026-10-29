import { verifyAccessToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/responseCodes.js';
import { User } from '../models/User.js';
import { USER_STATUS } from '../constants/roles.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      throw new ApiError(401, 'Authentication token missing', ERROR_CODES.UNAUTHORIZED);
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      throw new ApiError(401, 'Invalid or expired token', ERROR_CODES.INVALID_TOKEN);
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      throw new ApiError(401, 'User account no longer exists', ERROR_CODES.UNAUTHORIZED);
    }

    if (user.status === USER_STATUS.SUSPENDED) {
      throw new ApiError(403, 'Account has been suspended', ERROR_CODES.USER_SUSPENDED);
    }

    if (user.status === USER_STATUS.DELETED) {
      throw new ApiError(403, 'Account has been closed and deleted per data deletion request', ERROR_CODES.FORBIDDEN);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuthenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) return next();

    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id);
      if (user && user.status !== USER_STATUS.SUSPENDED) {
        req.user = user;
      }
    } catch (err) {
      // Ignore invalid token for optional auth
    }

    next();
  } catch (error) {
    next(); // Ignore errors and proceed as unauthenticated
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication token missing', ERROR_CODES.UNAUTHORIZED);
    }
    if (req.user.role === 'SUPER_ADMIN' || allowedRoles.includes(req.user.role)) {
      return next();
    }
    throw new ApiError(403, 'Access denied: Insufficient role permissions', ERROR_CODES.FORBIDDEN);
  };
};
