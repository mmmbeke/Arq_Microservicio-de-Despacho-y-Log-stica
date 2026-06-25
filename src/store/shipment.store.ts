import { Shipment, ShipmentStatus } from '../types/shipment.types';

const shipments = new Map<string, Shipment>();
const shipmentsByOrderId = new Map<string, string>();
const idempotencyCache = new Map<
  string,
  { payloadHash: string; shipmentId: string; statusCode: number }
>();

const VALID_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  CREATED: ['PICKING', 'FAILED'],
  PICKING: ['OUT_FOR_DELIVERY', 'FAILED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED'],
  DELIVERED: [],
  FAILED: [],
};

function baseShipment(partial: Partial<Shipment> & Pick<Shipment, 'shipmentId' | 'orderId' | 'status'>): Shipment {
  const now = '2026-06-15T10:00:00Z';
  return {
    shipmentId: partial.shipmentId,
    orderId: partial.orderId,
    userId: partial.userId ?? 'USR-01',
    status: partial.status,
    lines: partial.lines ?? [
      { sku: 'P-100', qty: 2, description: 'Caña de pescar Shimano FX' },
      { sku: 'P-205', qty: 1, description: 'Carrete Penn Pursuit IV' },
    ],
    shipTo: partial.shipTo ?? {
      fullName: 'Juan Perez',
      addressLine1: 'Avenida Siempreviva 742',
      city: 'Santiago',
      region: 'RM',
      postalCode: '8320000',
      country: 'CL',
    },
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
    deliveredAt: partial.deliveredAt ?? null,
    proof: partial.proof ?? null,
    version: partial.version ?? 1,
  };
}

function seed(): void {
  const seeds: Shipment[] = [
    baseShipment({
      shipmentId: 'shp_a1b2c3',
      orderId: 'ORD-1001',
      status: 'OUT_FOR_DELIVERY',
      version: 2,
      updatedAt: '2026-06-16T12:00:00Z',
    }),
    baseShipment({
      shipmentId: 'shp_b2c3d4',
      orderId: 'ORD-1002',
      userId: 'USR-02',
      status: 'CREATED',
      version: 1,
    }),
    baseShipment({
      shipmentId: 'shp_c3d4e5',
      orderId: 'ORD-1003',
      status: 'DELIVERED',
      version: 4,
      deliveredAt: '2026-06-14T18:00:00Z',
      updatedAt: '2026-06-14T18:00:00Z',
    }),
    baseShipment({
      shipmentId: 'shp_d4e5f6',
      orderId: 'ORD-1004',
      status: 'FAILED',
      version: 3,
      updatedAt: '2026-06-13T09:30:00Z',
    }),
    baseShipment({
      shipmentId: 'shp_e5f6g7',
      orderId: 'ORD-1005',
      status: 'PICKING',
      version: 2,
      updatedAt: '2026-06-16T08:00:00Z',
    }),
  ];

  for (const shipment of seeds) {
    shipments.set(shipment.shipmentId, shipment);
    shipmentsByOrderId.set(shipment.orderId, shipment.shipmentId);
  }
}

seed();

export function cloneShipment(shipment: Shipment): Shipment {
  return structuredClone(shipment);
}

export function getAllShipments(): Shipment[] {
  return Array.from(shipments.values()).map(cloneShipment);
}

export function getShipmentById(shipmentId: string): Shipment | undefined {
  const shipment = shipments.get(shipmentId);
  return shipment ? cloneShipment(shipment) : undefined;
}

export function getShipmentByOrderId(orderId: string): Shipment | undefined {
  const shipmentId = shipmentsByOrderId.get(orderId);
  return shipmentId ? getShipmentById(shipmentId) : undefined;
}

export function saveShipment(shipment: Shipment): Shipment {
  const copy = cloneShipment(shipment);
  shipments.set(copy.shipmentId, copy);
  shipmentsByOrderId.set(copy.orderId, copy.shipmentId);
  return cloneShipment(copy);
}

export function isValidTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
  if (from === to) return true;
  return VALID_TRANSITIONS[from].includes(to);
}

export function getIdempotencyEntry(key: string) {
  return idempotencyCache.get(key);
}

export function setIdempotencyEntry(
  key: string,
  payloadHash: string,
  shipmentId: string,
  statusCode: number
): void {
  idempotencyCache.set(key, { payloadHash, shipmentId, statusCode });
}

export function nextShipmentId(): string {
  return `shp_${Math.random().toString(36).slice(2, 10)}`;
}
