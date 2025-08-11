import { supabase } from '@/integrations/supabase/client';

// Base entity interface
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// Repository configuration
export interface RepositoryConfig {
  tableName: string;
  selectFields?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

// Query options
export interface QueryOptions {
  select?: string;
  filters?: Record<string, any>;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Pagination result
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Abstract base repository class
export abstract class BaseRepository<T extends BaseEntity> {
  protected abstract tableName: string;
  protected abstract selectFields: string;
  protected abstract orderBy: string;
  protected abstract orderDirection: 'asc' | 'desc';

  // Get current user ID
  protected async getCurrentUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || 'system';
  }

  // Find all entities with optional filters
  async findAll(options: QueryOptions = {}): Promise<T[]> {
    const {
      select = this.selectFields,
      filters = {},
      orderBy = this.orderBy,
      orderDirection = this.orderDirection,
      limit,
      offset
    } = options;

    let query = supabase
      .from(this.tableName)
      .select(select)
      .order(orderBy, { ascending: orderDirection === 'asc' });

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (typeof value === 'string' && value.includes('%')) {
          query = query.ilike(key, value);
        } else {
          query = query.eq(key, value);
        }
      }
    });

    // Apply pagination
    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
      query = query.range(offset, offset + (limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch ${this.tableName}: ${error.message}`);
    }

    return data || [];
  }

  // Find entity by ID
  async findById(id: string): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(this.selectFields)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch ${this.tableName} by ID: ${error.message}`);
    }

    return data;
  }

  // Create new entity
  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    const userId = await this.getCurrentUserId();
    const now = new Date().toISOString();

    const insertData = {
      ...data,
      created_by: userId,
      updated_by: userId,
      created_at: now,
      updated_at: now,
    };

    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(insertData)
      .select(this.selectFields)
      .single();

    if (error) {
      throw new Error(`Failed to create ${this.tableName}: ${error.message}`);
    }

    return result;
  }

  // Update entity by ID
  async update(id: string, updates: Partial<Omit<T, 'id' | 'created_at' | 'created_by'>>): Promise<T> {
    const userId = await this.getCurrentUserId();
    const now = new Date().toISOString();

    const updateData = {
      ...updates,
      updated_by: userId,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .select(this.selectFields)
      .single();

    if (error) {
      throw new Error(`Failed to update ${this.tableName}: ${error.message}`);
    }

    return data;
  }

  // Delete entity by ID
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete ${this.tableName}: ${error.message}`);
    }
  }

  // Soft delete entity by ID (if status field exists)
  async softDelete(id: string): Promise<T> {
    return this.update(id, { status: 'inactive' } as any);
  }

  // Find entities with pagination
  async findWithPagination(
    page: number = 1,
    limit: number = 20,
    options: Omit<QueryOptions, 'limit' | 'offset'> = {}
  ): Promise<PaginatedResult<T>> {
    const offset = (page - 1) * limit;

    // Get total count
    const { count, error: countError } = await supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Failed to count ${this.tableName}: ${countError.message}`);
    }

    // Get paginated data
    const data = await this.findAll({
      ...options,
      limit,
      offset,
    });

    return {
      data,
      total: count || 0,
      page,
      limit,
      hasMore: (page * limit) < (count || 0),
    };
  }

  // Search entities by text
  async search(searchTerm: string, searchFields: string[]): Promise<T[]> {
    let query = supabase
      .from(this.tableName)
      .select(this.selectFields);

    // Build search query
    const searchConditions = searchFields.map(field => `${field}.ilike.%${searchTerm}%`);
    query = query.or(searchConditions.join(','));

    const { data, error } = await query.order(this.orderBy, { ascending: this.orderDirection === 'asc' });

    if (error) {
      throw new Error(`Failed to search ${this.tableName}: ${error.message}`);
    }

    return data || [];
  }

  // Bulk create entities
  async bulkCreate(data: Omit<T, 'id' | 'created_at' | 'updated_at'>[]): Promise<T[]> {
    const userId = await this.getCurrentUserId();
    const now = new Date().toISOString();

    const insertData = data.map(item => ({
      ...item,
      created_by: userId,
      updated_by: userId,
      created_at: now,
      updated_at: now,
    }));

    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert(insertData)
      .select(this.selectFields);

    if (error) {
      throw new Error(`Failed to bulk create ${this.tableName}: ${error.message}`);
    }

    return result || [];
  }

  // Bulk update entities
  async bulkUpdate(updates: Array<{ id: string; updates: Partial<Omit<T, 'id' | 'created_at' | 'created_by'>> }>): Promise<T[]> {
    const userId = await this.getCurrentUserId();
    const now = new Date().toISOString();

    const updatePromises = updates.map(({ id, updates: updateData }) =>
      this.update(id, {
        ...updateData,
        updated_by: userId,
        updated_at: now,
      } as any)
    );

    return Promise.all(updatePromises);
  }

  // Check if entity exists
  async exists(id: string): Promise<boolean> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('id')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return false;
      }
      throw new Error(`Failed to check existence of ${this.tableName}: ${error.message}`);
    }

    return !!data;
  }

  // Get count with optional filters
  async count(filters: Record<string, any> = {}): Promise<number> {
    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      }
    });

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to count ${this.tableName}: ${error.message}`);
    }

    return count || 0;
  }
}
