export type ShipmentStatus =
  | 'CREATED'
  | 'PICKING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED';

export interface ShipmentLine {
  sku: string;
  qty: number;
  description?: string;
}

export interface Address {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region?: string;
  postalCode?: string;
  country: string;
}

export interface Shipment {
  shipmentId: string;
  orderId: string;
  userId: string;
  status: ShipmentStatus;
  lines: ShipmentLine[];
  shipTo: Address;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string | null;
  proof?: Record<string, unknown> | null;
  version: number;
}

export interface ShipmentPage {
  items: Shipment[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CreateShipmentRequest {
  orderId: string;
  notes?: string;
}

export interface PatchShipmentStatusRequest {
  status: ShipmentStatus;
  proof?: {
    type?: 'SIMULATED_SIGNATURE' | 'PHOTO_URL' | 'NONE';
    reference?: string;
  };
}

export interface ConfirmShipmentRequest {
  proof?: {
    type?: 'SIMULATED_SIGNATURE' | 'PHOTO_URL' | 'NONE';
    reference?: string;
  };
}

export interface RejectShipmentRequest {
  reason?: string;
}

export interface ErrorResponse {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  correlationId: string;
}

export type DispatchEventType =
  | 'ShipmentCreated'
  | 'ShipmentPicking'
  | 'ShipmentOutForDelivery'
  | 'ShipmentDelivered'
  | 'ShipmentFailed';

export interface DomainEvent {
  eventId: string;
  eventType: DispatchEventType;
  version: string;
  occurredAt: string;
  producer: 'dispatch-service';
  correlationId: string;
  payload: {
    userId: string;
    orderId: string;
    shipmentId: string;
    status: ShipmentStatus;
    reason?: string;
  };
}
