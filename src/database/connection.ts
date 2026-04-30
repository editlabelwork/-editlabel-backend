import { Pool, PoolClient } from 'pg';

let pool: Pool | null = null;

/**
 * Inicializa pool de conexões PostgreSQL
 */
export const initializeDatabase = (): Pool => {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    user: process.env.DB_USER || 'editlabel_app',
    password: process.env.DB_PASSWORD || 'change_me',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'editlabel',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.error('Erro no pool de conexões:', err);
  });

  return pool;
};

/**
 * Obtém cliente do pool
 */
export const getClient = async (): Promise<PoolClient> => {
  if (!pool) {
    initializeDatabase();
  }
  return pool!.connect();
};

/**
 * Executa query
 */
export const query = async (text: string, params?: any[]) => {
  if (!pool) {
    initializeDatabase();
  }
  return pool!.query(text, params);
};

/**
 * Inicia transação
 */
export const beginTransaction = async (client: PoolClient) => {
  await client.query('BEGIN');
};

/**
 * Commit de transação
 */
export const commit = async (client: PoolClient) => {
  await client.query('COMMIT');
};

/**
 * Rollback de transação
 */
export const rollback = async (client: PoolClient) => {
  await client.query('ROLLBACK');
};

/**
 * Fecha conexão
 */
export const closeConnection = async (client: PoolClient) => {
  client.release();
};

/**
 * Fecha pool
 */
export const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

/**
 * Executa query com transação
 */
export const withTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await getClient();
  try {
    await beginTransaction(client);
    const result = await callback(client);
    await commit(client);
    return result;
  } catch (error) {
    await rollback(client);
    throw error;
  } finally {
    closeConnection(client);
  }
};
