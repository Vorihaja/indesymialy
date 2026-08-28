export interface SuperAdminSystemPeriod {
  from: string;
  to: string;
}

export interface SuperAdminSystemTopTable {
  name: string;

  totalBytes: number;

  estimatedRows: number;
}

export interface SuperAdminSystemStorageBucket {
  bucketId: string;

  objects: number;

  bytes: number;
}

export interface SuperAdminSystemDatabase {
  reachable: boolean;

  sizeBytes: number;

  startedAt: string | null;

  uptimeSeconds: number | null;

  connections: number;

  activeConnections: number;

  idleConnections: number;

  maxConnections: number;

  connectionUsageRate: number | null;

  cacheHitRate: number | null;

  transactionsCommitted: number;

  transactionsRolledBack: number;

  rollbackRate: number | null;

  deadlocks: number;

  tempBytes: number;

  statsResetAt: string | null;

  publicTables: number;

  publicIndexes: number;

  extensions: number;

  topTables: SuperAdminSystemTopTable[];
}

export interface SuperAdminSystemAuth {
  available: boolean;

  totalUsers: number;

  newUsersPeriod: number;

  signInsPeriod: number;

  lastSignInAt: string | null;
}

export interface SuperAdminSystemStorage {
  available: boolean;

  buckets: number;

  objects: number;

  bytes: number;

  topBuckets: SuperAdminSystemStorageBucket[];
}

export interface SuperAdminSystemRealtime {
  databaseBackends: number;

  websocketConnectionsAvailable: boolean;
}

export interface SuperAdminSystemMigrations {
  available: boolean;

  count: number;

  latestVersion: string | null;
}

export interface SuperAdminSystemCoverage {
  databaseMetrics: boolean;

  authMetrics: boolean;

  storageMetrics: boolean;

  supabaseRpcLatency: boolean;

  applicationUptime: boolean;

  networkAvailabilityHistory: boolean;

  vercelErrors: boolean;

  authFailureRate: boolean;

  realtimeWebsocketConnections: boolean;
}

export interface SuperAdminSystemAnalytics {
  period: SuperAdminSystemPeriod;

  observedAt: string;

  rpcRoundTripMs: number;

  database: SuperAdminSystemDatabase;

  auth: SuperAdminSystemAuth;

  storage: SuperAdminSystemStorage;

  realtime: SuperAdminSystemRealtime;

  migrations: SuperAdminSystemMigrations;

  coverage: SuperAdminSystemCoverage;
}

export interface SuperAdminSystemSnapshot {
  capturedAt: string;

  periodDays: number;

  databaseSizeBytes: number;

  databaseConnections: number;

  activeConnections: number;

  connectionUsageRate: number | null;

  cacheHitRate: number | null;

  rollbackRate: number | null;

  deadlocks: number;

  tempBytes: number;

  authUsers: number;

  authSignInsPeriod: number;

  storageAvailable: boolean;

  storageObjects: number;

  storageBytes: number;

  realtimeDatabaseBackends: number;

  clientRpcLatencyMs: number | null;
}
