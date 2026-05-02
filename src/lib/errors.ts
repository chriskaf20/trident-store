/**
 * Custom Error Classes for Trident Store
 * Centralized error handling with proper typing and context
 */

export class AppError extends Error {
    public readonly code: string
    public readonly statusCode: number
    public readonly context?: Record<string, any>

    constructor(
        message: string,
        code: string,
        statusCode: number = 500,
        context?: Record<string, any>
    ) {
        super(message)
        this.name = this.constructor.name
        this.code = code
        this.statusCode = statusCode
        this.context = context

        // Maintain proper prototype chain for instanceof checks
        Object.setPrototypeOf(this, AppError.prototype)
    }
}

/**
 * Validation Error - User input is invalid
 * Examples: Missing required fields, invalid email, quantity too high
 */
export class ValidationError extends AppError {
    constructor(message: string, context?: Record<string, any>) {
        super(message, 'VALIDATION_ERROR', 400, context)
        Object.setPrototypeOf(this, ValidationError.prototype)
    }
}

/**
 * Authentication Error - User not authenticated
 * Examples: Missing session, invalid token, session expired
 */
export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication required', context?: Record<string, any>) {
        super(message, 'AUTHENTICATION_ERROR', 401, context)
        Object.setPrototypeOf(this, AuthenticationError.prototype)
    }
}

/**
 * Authorization Error - User authenticated but lacks permissions
 * Examples: Non-admin accessing admin route, vendor accessing other vendor's store
 */
export class AuthorizationError extends AppError {
    constructor(message: string = 'You do not have permission to perform this action', context?: Record<string, any>) {
        super(message, 'AUTHORIZATION_ERROR', 403, context)
        Object.setPrototypeOf(this, AuthorizationError.prototype)
    }
}

/**
 * Not Found Error - Resource doesn't exist
 * Examples: Product not found, order not found, user not found
 */
export class NotFoundError extends AppError {
    constructor(resource: string, context?: Record<string, any>) {
        super(`${resource} not found`, 'NOT_FOUND_ERROR', 404, context)
        Object.setPrototypeOf(this, NotFoundError.prototype)
    }
}

/**
 * Conflict Error - Operation conflicts with current state
 * Examples: Duplicate email on signup, store already exists, overselling inventory
 */
export class ConflictError extends AppError {
    constructor(message: string, context?: Record<string, any>) {
        super(message, 'CONFLICT_ERROR', 409, context)
        Object.setPrototypeOf(this, ConflictError.prototype)
    }
}

/**
 * Inventory Error - Product inventory issue (specific ConflictError variant)
 * Examples: Out of stock, insufficient quantity, stock reserved
 */
export class InventoryError extends ConflictError {
    constructor(message: string, context?: Record<string, any>) {
        super(message, { ...context, type: 'INVENTORY' })
        Object.setPrototypeOf(this, InventoryError.prototype)
    }
}

/**
 * Database Error - Database operation failed
 * Examples: Query failed, connection lost, constraint violated
 */
export class DatabaseError extends AppError {
    constructor(message: string, context?: Record<string, any>) {
        super(message, 'DATABASE_ERROR', 500, context)
        Object.setPrototypeOf(this, DatabaseError.prototype)
    }
}

/**
 * External Service Error - Third-party service failed
 * Examples: Email service down, payment gateway timeout, storage service error
 */
export class ExternalServiceError extends AppError {
    constructor(service: string, message: string, context?: Record<string, any>) {
        super(
            `${service} service error: ${message}`,
            'EXTERNAL_SERVICE_ERROR',
            503,
            { ...context, service }
        )
        Object.setPrototypeOf(this, ExternalServiceError.prototype)
    }
}

/**
 * Business Logic Error - Operation violates business rules
 * Examples: Cannot refund already refunded order, vendor cannot manage other vendor's products
 */
export class BusinessLogicError extends AppError {
    constructor(message: string, context?: Record<string, any>) {
        super(message, 'BUSINESS_LOGIC_ERROR', 422, context)
        Object.setPrototypeOf(this, BusinessLogicError.prototype)
    }
}

/**
 * Type guard to check if error is AppError
 */
export function isAppError(error: unknown): error is AppError {
    return error instanceof AppError
}

/**
 * Safe error message extractor - never leaks internal details
 */
export function getErrorMessage(error: unknown): string {
    if (isAppError(error)) {
        return error.message
    }
    if (error instanceof Error) {
        return error.message
    }
    return 'An unexpected error occurred'
}

/**
 * Error response formatter for API/server actions
 */
export function formatErrorResponse(error: unknown) {
    if (isAppError(error)) {
        return {
            error: error.message,
            code: error.code,
            statusCode: error.statusCode,
        }
    }

    if (error instanceof Error) {
        return {
            error: 'An unexpected error occurred',
            code: 'UNKNOWN_ERROR',
            statusCode: 500,
        }
    }

    return {
        error: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
        statusCode: 500,
    }
}
