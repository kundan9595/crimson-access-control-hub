import { BaseRepository, QueryOptions, PaginatedResult } from '../repositories/BaseRepository';

// Service configuration
export interface ServiceConfig<T> {
  repository: BaseRepository<T>;
  entityName: string;
}

// Service result wrapper
export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Paginated service result
export interface PaginatedServiceResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  error: string | null;
  success: boolean;
}

// Abstract base service class
export abstract class BaseService<T> {
  protected repository: BaseRepository<T>;
  protected entityName: string;

  constructor(config: ServiceConfig<T>) {
    this.repository = config.repository;
    this.entityName = config.entityName;
  }

  // Get all entities
  async getAll(options: QueryOptions = {}): Promise<ServiceResult<T[]>> {
    try {
      const data = await this.repository.findAll(options);
      return {
        data,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: `Failed to fetch ${this.entityName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
      };
    }
  }

  // Get entity by ID
  async getById(id: string): Promise<ServiceResult<T>> {
    try {
      const data = await this.repository.findById(id);
      if (!data) {
        return {
          data: null,
          error: `${this.entityName} not found`,
          success: false,
        };
      }
      return {
        data,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: `Failed to fetch ${this.entityName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
      };
    }
  }

  // Create new entity
  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResult<T>> {
    try {
      const result = await this.repository.create(data);
      return {
        data: result,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: `Failed to create ${this.entityName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
      };
    }
  }

  // Update entity
  async update(id: string, updates: Partial<Omit<T, 'id' | 'created_at' | 'created_by'>>): Promise<ServiceResult<T>> {
    try {
      const data = await this.repository.update(id, updates);
      return {
        data,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: `Failed to update ${this.entityName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
      };
    }
  }

  // Delete entity
  async delete(id: string): Promise<ServiceResult<void>> {
    try {
      await this.repository.delete(id);
      return {
        data: null,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: `Failed to delete ${this.entityName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
      };
    }
  }

  // Soft delete entity
  async softDelete(id: string): Promise<ServiceResult<T>> {
    try {
      const data = await this.repository.softDelete(id);
      return {
        data,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: `Failed to soft delete ${this.entityName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
      };
    }
  }

  // Get paginated entities
  async getPaginated(
    page: number = 1,
    limit: number = 20,
    options: Omit<QueryOptions, 'limit' | 'offset'> = {}
  ): Promise<PaginatedServiceResult<T>> {
    try {
      const result = await this.repository.findWithPagination(page, limit, options);
      return {
        ...result,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        hasMore: false,
        error: `Failed to fetch paginated ${this.entityName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
      };
    }
  }

  // Search entities
  async search(searchTerm: string, searchFields: string[]): Promise<ServiceResult<T[]>> {
    try {
      const data = await this.repository.search(searchTerm, searchFields);
      return {
        data,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: `Failed to search ${this.entityName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
      };
    }
  }

  // Bulk create entities
  async bulkCreate(data: Omit<T, 'id' | 'created_at' | 'updated_at'>[]): Promise<ServiceResult<T[]>> {
    try {
      const result = await this.repository.bulkCreate(data);
      return {
        data: result,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: `Failed to bulk create ${this.entityName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
      };
    }
  }

  // Bulk update entities
  async bulkUpdate(updates: Array<{ id: string; updates: Partial<Omit<T, 'id' | 'created_at' | 'created_by'>> }>): Promise<ServiceResult<T[]>> {
    try {
      const result = await this.repository.bulkUpdate(updates);
      return {
        data: result,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: `Failed to bulk update ${this.entityName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
      };
    }
  }

  // Check if entity exists
  async exists(id: string): Promise<ServiceResult<boolean>> {
    try {
      const exists = await this.repository.exists(id);
      return {
        data: exists,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: `Failed to check existence of ${this.entityName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
      };
    }
  }

  // Get count
  async count(filters: Record<string, any> = {}): Promise<ServiceResult<number>> {
    try {
      const count = await this.repository.count(filters);
      return {
        data: count,
        error: null,
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        error: `Failed to count ${this.entityName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
      };
    }
  }

  // Validate entity data (to be implemented by subclasses)
  protected validateData(data: any): { isValid: boolean; errors: string[] } {
    return { isValid: true, errors: [] };
  }

  // Transform entity data (to be implemented by subclasses)
  protected transformData(data: any): any {
    return data;
  }

  // Pre-process data before creation
  protected async preProcessCreate(data: any): Promise<any> {
    return this.transformData(data);
  }

  // Pre-process data before update
  protected async preProcessUpdate(data: any): Promise<any> {
    return this.transformData(data);
  }

  // Post-process data after fetch
  protected async postProcessFetch(data: any): Promise<any> {
    return data;
  }
}
