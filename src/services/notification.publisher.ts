import { DomainEvent, DispatchEventType, Shipment, ShipmentStatus } from '../types/shipment.types';

function buildEvent(
  eventType: DispatchEventType,
  shipment: Shipment,
  correlationId: string,
  reason?: string
): DomainEvent {
  return {
    eventId: crypto.randomUUID(),
    eventType,
    version: '1.0',
    occurredAt: new Date().toISOString(),
    producer: 'dispatch-service',
    correlationId,
    payload: {
      userId: shipment.userId,
      orderId: shipment.orderId,
      shipmentId: shipment.shipmentId,
      status: shipment.status,
      ...(reason ? { reason } : {}),
    },
  };
}

function eventTypeForStatus(status: ShipmentStatus): DispatchEventType | null {
  switch (status) {
    case 'CREATED':
      return 'ShipmentCreated';
    case 'PICKING':
      return 'ShipmentPicking';
    case 'OUT_FOR_DELIVERY':
      return 'ShipmentOutForDelivery';
    case 'DELIVERED':
      return 'ShipmentDelivered';
    case 'FAILED':
      return 'ShipmentFailed';
    default:
      return null;
  }
}

/**
 * Publica eventos hacia G9 (POST /notifications/events).
 * En mock: siempre loguea; si G9_NOTIFICATION_SERVICE_URL está definido, intenta envío REST.
 */
export async function publishShipmentEvent(
  shipment: Shipment,
  correlationId: string,
  reason?: string
): Promise<void> {
  const eventType = eventTypeForStatus(shipment.status);
  if (!eventType) return;

  const event = buildEvent(eventType, shipment, correlationId, reason);
  console.log(`[event] ${event.eventType}`, JSON.stringify(event));

  const g9Url = process.env.G9_NOTIFICATION_SERVICE_URL;
  if (!g9Url) return;

  try {
    await fetch(`${g9Url}/notifications/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': crypto.randomUUID(),
        'X-Correlation-Id': correlationId,
        'X-Consumer': 'dispatch-service',
      },
      body: JSON.stringify(event),
    });
  } catch (error) {
    console.warn('[g9-client] evento no entregado (consistencia eventual):', error);
  }
}
