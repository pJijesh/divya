import { postgresConnector } from '@/lib/connectors/postgres';
import type { Connector } from '@/lib/connectors/types';

const CONNECTORS: Record<string, Connector> = {
  postgres: postgresConnector,
};

// Route Handlers and the semantic query-compiler go through this registry
// only — never import a specific driver directly — so adding a new
// connector type later is "implement Connector, add it here," with no
// changes anywhere else.
export function getConnector(type: string): Connector {
  const connector = CONNECTORS[type];
  if (!connector) {
    throw new Error(`Unknown data source type: ${type}`);
  }
  return connector;
}
