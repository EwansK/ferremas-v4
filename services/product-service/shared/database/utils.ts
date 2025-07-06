import { PoolClient } from 'pg';
import dbConnection from './connection';

export class DatabaseUtils {
  static async executeQuery(query: string, params?: any[]): Promise<any> {
    return await dbConnection.query(query, params);
  }

  static async findById<T>(table: string, id: string): Promise<T | null> {
    const result = await dbConnection.query(
      `SELECT * FROM ${table} WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findOne<T>(table: string, conditions: Record<string, any>): Promise<T | null> {
    const keys = Object.keys(conditions);
    const values = Object.values(conditions);
    const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
    
    const result = await dbConnection.query(
      `SELECT * FROM ${table} WHERE ${whereClause}`,
      values
    );
    return result.rows[0] || null;
  }

  static async findMany<T>(
    table: string, 
    conditions?: Record<string, any>,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<T[]> {
    let query = `SELECT * FROM ${table}`;
    const params: any[] = [];
    let paramIndex = 1;

    if (conditions && Object.keys(conditions).length > 0) {
      const keys = Object.keys(conditions);
      const whereClause = keys.map((key) => {
        params.push(conditions[key]);
        return `${key} = $${paramIndex++}`;
      }).join(' AND ');
      query += ` WHERE ${whereClause}`;
    }

    if (options?.orderBy) {
      query += ` ORDER BY ${options.orderBy} ${options.orderDirection || 'ASC'}`;
    }

    if (options?.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(options.limit);
    }

    if (options?.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(options.offset);
    }

    const result = await dbConnection.query(query, params);
    return result.rows;
  }

  static async create<T>(table: string, data: Record<string, any>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    const columns = keys.join(', ');

    const result = await dbConnection.query(
      `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async update<T>(
    table: string, 
    id: string, 
    data: Record<string, any>
  ): Promise<T | null> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');

    const result = await dbConnection.query(
      `UPDATE ${table} SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0] || null;
  }

  static async delete(table: string, id: string): Promise<boolean> {
    const result = await dbConnection.query(
      `DELETE FROM ${table} WHERE id = $1`,
      [id]
    );
    return result.rowCount > 0;
  }

  static async softDelete(table: string, id: string): Promise<boolean> {
    const result = await dbConnection.query(
      `UPDATE ${table} SET is_active = false WHERE id = $1`,
      [id]
    );
    return result.rowCount > 0;
  }

  static async count(table: string, conditions?: Record<string, any>): Promise<number> {
    let query = `SELECT COUNT(*) FROM ${table}`;
    const params: any[] = [];

    if (conditions && Object.keys(conditions).length > 0) {
      const keys = Object.keys(conditions);
      const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
      query += ` WHERE ${whereClause}`;
      params.push(...Object.values(conditions));
    }

    const result = await dbConnection.query(query, params);
    return parseInt(result.rows[0].count);
  }

  static async exists(table: string, conditions: Record<string, any>): Promise<boolean> {
    const count = await this.count(table, conditions);
    return count > 0;
  }

  static buildPaginationInfo(page: number, limit: number, total: number) {
    return {
      page: Math.max(1, page),
      limit: Math.max(1, limit),
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    };
  }

  static async withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    return await dbConnection.transaction(callback);
  }

  static generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }

  static async ensureUniqueSlug(table: string, baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const conditions: Record<string, any> = { slug };
      let query = `SELECT COUNT(*) FROM ${table} WHERE slug = $1`;
      const params = [slug];

      if (excludeId) {
        query += ` AND id != $2`;
        params.push(excludeId);
      }

      const result = await dbConnection.query(query, params);
      const count = parseInt(result.rows[0].count);

      if (count === 0) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
}

export default DatabaseUtils;