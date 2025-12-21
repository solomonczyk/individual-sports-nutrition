import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  authMiddleware,
  errorHandlingMiddleware,
  corsMiddleware,
  validationMiddleware,
  loggingMiddleware,
} from '../../src/middlewares';

describe('Authentication Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  it('should allow request with valid JWT token', () => {
    // Arrange
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzEyMyJ9.abc123';
    req.headers = { authorization: `Bearer ${validToken}` };

    // Act
    authMiddleware(req as Request, res as Response, next);

    // Assert
    expect(next).toHaveBeenCalled();
  });

  it('should reject request without token', () => {
    // Arrange
    req.headers = {};

    // Act
    authMiddleware(req as Request, res as Response, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Unauthorized',
        message: 'Missing authentication token',
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject request with invalid token format', () => {
    // Arrange
    req.headers = { authorization: 'InvalidToken' };

    // Act
    authMiddleware(req as Request, res as Response, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject request with malformed JWT', () => {
    // Arrange
    req.headers = { authorization: 'Bearer invalid.jwt.token' };

    // Act
    authMiddleware(req as Request, res as Response, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should extract user ID from valid token', () => {
    // Arrange
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzEyMyJ9.abc123';
    req.headers = { authorization: `Bearer ${validToken}` };

    // Act
    authMiddleware(req as Request, res as Response, next);

    // Assert
    expect((req as any).userId).toBe('user_123');
    expect(next).toHaveBeenCalled();
  });
});

describe('Error Handling Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  it('should handle validation errors', () => {
    // Arrange
    const error = new Error('Validation failed');
    (error as any).status = 400;
    (error as any).details = { age: 'Must be between 13 and 120' };

    // Act
    errorHandlingMiddleware(error, req as Request, res as Response, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'ValidationError',
        details: { age: 'Must be between 13 and 120' },
      })
    );
  });

  it('should handle 401 unauthorized errors', () => {
    // Arrange
    const error = new Error('Unauthorized');
    (error as any).status = 401;

    // Act
    errorHandlingMiddleware(error, req as Request, res as Response, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should handle 404 not found errors', () => {
    // Arrange
    const error = new Error('Resource not found');
    (error as any).status = 404;

    // Act
    errorHandlingMiddleware(error, req as Request, res as Response, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 500 for unhandled errors', () => {
    // Arrange
    const error = new Error('Unexpected error');

    // Act
    errorHandlingMiddleware(error, req as Request, res as Response, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'InternalServerError',
      })
    );
  });

  it('should log error details', () => {
    // Arrange
    const consoleSpy = vi.spyOn(console, 'error');
    const error = new Error('Test error');

    // Act
    errorHandlingMiddleware(error, req as Request, res as Response, next);

    // Assert
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('CORS Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {
        origin: 'https://example.com',
      },
    };
    res = {
      setHeader: vi.fn().mockReturnThis(),
      end: vi.fn(),
    };
    next = vi.fn();
  });

  it('should set CORS headers for allowed origins', () => {
    // Act
    corsMiddleware(req as Request, res as Response, next);

    // Assert
    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      expect.any(String)
    );
    expect(next).toHaveBeenCalled();
  });

  it('should handle preflight OPTIONS requests', () => {
    // Arrange
    req.method = 'OPTIONS';

    // Act
    corsMiddleware(req as Request, res as Response, next);

    // Assert
    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Methods',
      expect.any(String)
    );
  });

  it('should include credentials header when needed', () => {
    // Act
    corsMiddleware(req as Request, res as Response, next);

    // Assert
    expect(res.setHeader).toHaveBeenCalledWith(
      'Access-Control-Allow-Credentials',
      expect.any(String)
    );
  });
});

describe('Validation Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      query: {},
      body: {},
      params: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  it('should validate required query parameters', () => {
    // Arrange
    req.query = {}; // Missing required parameters
    const validator = validationMiddleware({
      query: { goal: 'string', activity_level: 'string' },
    });

    // Act
    validator(req as Request, res as Response, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should pass validation with all required parameters', () => {
    // Arrange
    req.query = {
      goal: 'weight_loss',
      activity_level: 'moderate',
    };
    const validator = validationMiddleware({
      query: { goal: 'string', activity_level: 'string' },
    });

    // Act
    validator(req as Request, res as Response, next);

    // Assert
    expect(next).toHaveBeenCalled();
  });

  it('should validate parameter types', () => {
    // Arrange
    req.query = {
      age: 'not-a-number', // Should be integer
    };
    const validator = validationMiddleware({
      query: { age: 'integer' },
    });

    // Act
    validator(req as Request, res as Response, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should validate enum values', () => {
    // Arrange
    req.query = {
      goal: 'invalid_goal',
    };
    const validator = validationMiddleware({
      query: {
        goal: {
          type: 'string',
          enum: ['weight_loss', 'muscle_gain', 'health'],
        },
      },
    });

    // Act
    validator(req as Request, res as Response, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should validate min/max constraints', () => {
    // Arrange
    req.query = {
      age: '10', // Below minimum of 13
    };
    const validator = validationMiddleware({
      query: {
        age: {
          type: 'integer',
          minimum: 13,
          maximum: 120,
        },
      },
    });

    // Act
    validator(req as Request, res as Response, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should validate request body', () => {
    // Arrange
    req.body = {
      email: 'invalid-email',
    };
    const validator = validationMiddleware({
      body: {
        email: {
          type: 'string',
          format: 'email',
        },
      },
    });

    // Act
    validator(req as Request, res as Response, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should allow optional parameters', () => {
    // Arrange
    req.query = {
      goal: 'weight_loss',
      // optional limit not provided
    };
    const validator = validationMiddleware({
      query: {
        goal: { type: 'string', required: true },
        limit: { type: 'integer', required: false },
      },
    });

    // Act
    validator(req as Request, res as Response, next);

    // Assert
    expect(next).toHaveBeenCalled();
  });
});

describe('Logging Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      method: 'GET',
      path: '/api/v1/recommendations',
      headers: {},
    };
    res = {
      statusCode: 200,
    };
    next = vi.fn();
  });

  it('should log request details', () => {
    // Arrange
    const consoleSpy = vi.spyOn(console, 'log');

    // Act
    loggingMiddleware(req as Request, res as Response, next);

    // Assert
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('GET')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/recommendations')
    );
    consoleSpy.mockRestore();
  });

  it('should measure request duration', (done) => {
    // Arrange
    const consoleSpy = vi.spyOn(console, 'log');

    // Act
    loggingMiddleware(req as Request, res as Response, () => {
      setTimeout(() => {
        // Simulate response
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
        done();
      }, 10);
    });
  });

  it('should log request ID for tracing', () => {
    // Arrange
    const consoleSpy = vi.spyOn(console, 'log');

    // Act
    loggingMiddleware(req as Request, res as Response, next);

    // Assert
    expect((req as any).requestId).toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining((req as any).requestId)
    );
    consoleSpy.mockRestore();
  });

  it('should log response status', () => {
    // Arrange
    const consoleSpy = vi.spyOn(console, 'log');
    res.statusCode = 200;

    // Act
    loggingMiddleware(req as Request, res as Response, next);

    // Assert
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
