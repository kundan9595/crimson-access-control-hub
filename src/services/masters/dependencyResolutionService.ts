import { supabase } from '@/integrations/supabase/client';
import { 
  MASTER_DEPENDENCIES, 
  MasterDependency, 
  MasterConfig,
  getMasterDependencies,
  getDependencyOrder 
} from '@/constants/masterDependencies';
import { toast } from 'sonner';

export interface DependencyResolutionResult {
  success: boolean;
  resolvedIds: Record<string, string>;
  errors: string[];
  createdCounts: Record<string, number>;
  updatedCounts: Record<string, number>;
}

export interface DuplicateHandlingStrategy {
  ignore: boolean; // true = ignore duplicates, false = update duplicates
}

export class DependencyResolutionService {
  private cache: Map<string, Map<string, string>> = new Map(); // table -> name -> id
  private createdCounts: Record<string, number> = {};
  private updatedCounts: Record<string, number> = {};

  constructor(private duplicateStrategy: DuplicateHandlingStrategy) {
    this.resetCounts();
  }

  private resetCounts() {
    this.createdCounts = {};
    this.updatedCounts = {};
  }

  /**
   * Resolve all dependencies for a given master type and data
   */
  async resolveDependencies(
    masterType: string, 
    records: any[]
  ): Promise<DependencyResolutionResult> {
    this.resetCounts();
    const errors: string[] = [];
    const resolvedIds: Record<string, string> = {};

    try {
      const dependencies = getMasterDependencies(masterType);
      
      // Process dependencies in order
      for (const dependency of dependencies) {
        const dependencyRecords = this.extractDependencyRecords(records, dependency);
        
        if (dependencyRecords.length > 0) {
          const result = await this.resolveDependency(dependency, dependencyRecords);
          
          if (!result.success) {
            errors.push(...result.errors);
          } else {
            // Merge resolved IDs
            Object.assign(resolvedIds, result.resolvedIds);
          }
        }
      }

      return {
        success: errors.length === 0,
        resolvedIds,
        errors,
        createdCounts: { ...this.createdCounts },
        updatedCounts: { ...this.updatedCounts }
      };
    } catch (error) {
      console.error('Dependency resolution error:', error);
      return {
        success: false,
        resolvedIds: {},
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        createdCounts: { ...this.createdCounts },
        updatedCounts: { ...this.updatedCounts }
      };
    }
  }

  /**
   * Extract unique dependency records from the main records
   */
  private extractDependencyRecords(records: any[], dependency: MasterDependency): any[] {
    const dependencyRecords: any[] = [];
    const seen = new Set<string>();

    records.forEach(record => {
      const dependencyName = record[dependency.nameField];
      if (dependencyName && !seen.has(dependencyName)) {
        seen.add(dependencyName);
        
        // Create a dependency record with the name
        const dependencyRecord: any = {
          name: dependencyName
        };

        // Add other fields if they exist in the main record
        if (dependency.table === 'brands' || dependency.table === 'categories') {
          dependencyRecord.description = record[`${dependency.nameField} Description`] || '';
          dependencyRecord.status = record[`${dependency.nameField} Status`] || 'active';
        } else if (dependency.table === 'colors') {
          dependencyRecord.hex_code = record[`${dependency.nameField} Hex Code`] || '#000000';
          dependencyRecord.status = record[`${dependency.nameField} Status`] || 'active';
        } else if (dependency.table === 'sizeGroups') {
          dependencyRecord.description = record[`${dependency.nameField} Description`] || '';
          dependencyRecord.status = record[`${dependency.nameField} Status`] || 'active';
        } else if (dependency.table === 'styles') {
          dependencyRecord.description = record[`${dependency.nameField} Description`] || '';
          dependencyRecord.status = record[`${dependency.nameField} Status`] || 'active';
        } else if (dependency.table === 'classes') {
          dependencyRecord.description = record[`${dependency.nameField} Description`] || '';
          dependencyRecord.gst_rate = parseFloat(record[`${dependency.nameField} GST Rate`]) || 0;
          dependencyRecord.status = record[`${dependency.nameField} Status`] || 'active';
        } else if (dependency.table === 'sizes') {
          dependencyRecord.code = record[`${dependency.nameField} Code`] || '';
          dependencyRecord.status = record[`${dependency.nameField} Status`] || 'active';
        } else if (dependency.table === 'add-ons') {
          dependencyRecord.select_type = record[`${dependency.nameField} Select Type`] || 'single';
          dependencyRecord.price = parseFloat(record[`${dependency.nameField} Price`]) || 0;
          dependencyRecord.status = record[`${dependency.nameField} Status`] || 'active';
        }

        dependencyRecords.push(dependencyRecord);
      }
    });

    return dependencyRecords;
  }

  /**
   * Resolve a single dependency
   */
  private async resolveDependency(
    dependency: MasterDependency, 
    dependencyRecords: any[]
  ): Promise<{ success: boolean; resolvedIds: Record<string, string>; errors: string[] }> {
    const resolvedIds: Record<string, string> = {};
    const errors: string[] = [];

    try {
      // Check if we need to resolve dependencies for this dependency
      const dependencyConfig = MASTER_DEPENDENCIES[dependency.table];
      if (dependencyConfig && !dependencyConfig.independent) {
        const dependencyResolution = await this.resolveDependencies(dependency.table, dependencyRecords);
        if (!dependencyResolution.success) {
          errors.push(...dependencyResolution.errors);
        }
      }

      // Now create or find the dependency records
      for (const record of dependencyRecords) {
        try {
          const id = await this.createOrFindDependency(dependency.table, record);
          if (id) {
            resolvedIds[record.name] = id;
          } else {
            errors.push(`Failed to create or find ${dependency.table} with name: ${record.name}`);
          }
        } catch (error) {
          errors.push(`Error processing ${dependency.table} ${record.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return {
        success: errors.length === 0,
        resolvedIds,
        errors
      };
    } catch (error) {
      return {
        success: false,
        resolvedIds: {},
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Create or find a dependency record
   */
  private async createOrFindDependency(table: string, record: any): Promise<string | null> {
    try {
      // First, try to find existing record
      const { data: existing } = await supabase
        .from(table)
        .select('id')
        .eq('name', record.name)
        .single();

      if (existing) {
        // Record exists
        if (!this.duplicateStrategy.ignore) {
          // Update the existing record
          const { error: updateError } = await supabase
            .from(table)
            .update(record)
            .eq('id', existing.id);

          if (updateError) {
            console.error(`Error updating ${table}:`, updateError);
            return null;
          }

          this.updatedCounts[table] = (this.updatedCounts[table] || 0) + 1;
        }
        return existing.id;
      } else {
        // Create new record
        const { data: newRecord, error: createError } = await supabase
          .from(table)
          .insert(record)
          .select('id')
          .single();

        if (createError) {
          console.error(`Error creating ${table}:`, createError);
          return null;
        }

        this.createdCounts[table] = (this.createdCounts[table] || 0) + 1;
        return newRecord.id;
      }
    } catch (error) {
      console.error(`Error in createOrFindDependency for ${table}:`, error);
      return null;
    }
  }

  /**
   * Transform records to include resolved IDs
   */
  transformRecordsWithResolvedIds(
    records: any[], 
    masterType: string, 
    resolvedIds: Record<string, string>
  ): any[] {
    const dependencies = getMasterDependencies(masterType);
    
    return records.map(record => {
      const transformedRecord = { ...record };

      dependencies.forEach(dependency => {
        const dependencyName = record[dependency.nameField];
        if (dependencyName && resolvedIds[dependencyName]) {
          transformedRecord[dependency.lookupField] = resolvedIds[dependencyName];
        }
      });

      return transformedRecord;
    });
  }

  /**
   * Get summary of operations performed
   */
  getSummary(): { created: Record<string, number>; updated: Record<string, number> } {
    return {
      created: { ...this.createdCounts },
      updated: { ...this.updatedCounts }
    };
  }
}

/**
 * Factory function to create dependency resolution service
 */
export function createDependencyResolutionService(
  duplicateStrategy: DuplicateHandlingStrategy = { ignore: false }
): DependencyResolutionService {
  return new DependencyResolutionService(duplicateStrategy);
} 