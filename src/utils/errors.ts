import { Response } from 'express';
import { ErrorResponse } from '../types/shipment.types';

export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public correlationId: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function getCorrelationId(header?: string): string {
  return header?.trim() || `corr-${Date.now()}`;
}

export function toErrorBody(
  status: number,
  code: string,
  message: string,
  correlationId: string
): ErrorResponse {
  return {
    timestamp: new Date().toISOString(),
    status,
    code,
    message,
    correlationId,
  };
}

export function sendError(res: Response, error: AppError): void {
  res.status(error.status).json(
    toErrorBody(error.status, error.code, error.message, error.correlationId)
  );
}

export function handleControllerError(
  res: Response,
  error: unknown,
  correlationId: string
): void {
  if (error instanceof AppError) {
    sendError(res, error);
    return;
  }

  console.error('[despacho] error inesperado:', error);
  res.status(500).json(
    toErrorBody(500, 'INTERNAL_ERROR', 'Error interno del servidor.', correlationId)
  );
}
