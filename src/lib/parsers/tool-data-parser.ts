/**
 * Tool Data Parser - Handles different data formats from various tool sources
 */

export interface ParsedToolData {
  success: boolean;
  rawData: any;
  parsedData: any;
  dataSource: 'direct' | 'nested_result' | 'nested_data' | 'unknown';
  debugInfo: {
    originalKeys: string[];
    dataType: string;
    hasSuccess: boolean;
    hasResult: boolean;
    hasData: boolean;
  };
}

/**
 * Parse tool data with debugging information
 */
export function parseToolData(data: any, toolName: string): ParsedToolData {
  const debugInfo = {
    originalKeys: data && typeof data === 'object' ? Object.keys(data) : [],
    dataType: typeof data,
    hasSuccess: data?.success !== undefined,
    hasResult: data?.result !== undefined,
    hasData: data?.data !== undefined,
  };

  console.log(`[TOOL_PARSER] Parsing data for ${toolName}:`, {
    data,
    debugInfo,
    dataPreview: JSON.stringify(data, null, 2).slice(0, 500)
  });

  // Handle null/undefined
  if (!data) {
    console.log(`[TOOL_PARSER] No data provided for ${toolName}`);
    return {
      success: false,
      rawData: data,
      parsedData: null,
      dataSource: 'unknown',
      debugInfo
    };
  }

  // Handle primitive values
  if (typeof data !== 'object') {
    console.log(`[TOOL_PARSER] Primitive value for ${toolName}:`, data);
    return {
      success: true,
      rawData: data,
      parsedData: data,
      dataSource: 'direct',
      debugInfo
    };
  }

  let parsedData = data;
  let dataSource: ParsedToolData['dataSource'] = 'direct';

  // Pattern 1: Direct format { success: true, entities: [...] }
  if (data.success !== undefined) {
    console.log(`[TOOL_PARSER] Direct format detected for ${toolName}`);
    parsedData = data;
    dataSource = 'direct';
  }
  // Pattern 2: Nested in result { result: { success: true, entities: [...] } }
  else if (data.result && typeof data.result === 'object') {
    console.log(`[TOOL_PARSER] Nested result format detected for ${toolName}`);
    parsedData = data.result;
    dataSource = 'nested_result';
  }
  // Pattern 3: Nested in data { data: { success: true, entities: [...] } }
  else if (data.data && typeof data.data === 'object') {
    console.log(`[TOOL_PARSER] Nested data format detected for ${toolName}`);
    parsedData = data.data;
    dataSource = 'nested_data';
  }
  // Pattern 4: Tool-specific nested structures
  else if (toolName === 'search_entities' && data.entities) {
    console.log(`[TOOL_PARSER] Tool-specific format for ${toolName} - entities found directly`);
    parsedData = { success: true, entities: data.entities };
    dataSource = 'direct';
  }
  else {
    console.log(`[TOOL_PARSER] Unknown format for ${toolName}, using as-is`);
    dataSource = 'unknown';
  }

  const result: ParsedToolData = {
    success: parsedData?.success !== false, // Default to true unless explicitly false
    rawData: data,
    parsedData,
    dataSource,
    debugInfo
  };

  console.log(`[TOOL_PARSER] Final parsed result for ${toolName}:`, result);
  
  return result;
}

/**
 * Specific parsers for different tool types
 */

export function parseSearchEntitiesData(data: any) {
  const parsed = parseToolData(data, 'search_entities');
  
  // Additional search entities specific parsing
  if (parsed.parsedData?.entities) {
    return {
      ...parsed.parsedData,
      entities: parsed.parsedData.entities,
      count: parsed.parsedData.entities.length
    };
  }
  
  // Try to find entities in different locations
  if (data?.result?.entities) {
    return {
      success: true,
      entities: data.result.entities,
      count: data.result.entities.length
    };
  }
  
  if (data?.data?.entities) {
    return {
      success: true,
      entities: data.data.entities,
      count: data.data.entities.length
    };
  }

  console.warn('[TOOL_PARSER] Could not find entities in search_entities data:', data);
  return {
    success: false,
    entities: [],
    count: 0
  };
}

export function parseMemoryToolData(data: any) {
  const parsed = parseToolData(data, 'memory_tool');
  return parsed.parsedData;
}

export function parsePanelUpdateData(data: any) {
  const parsed = parseToolData(data, 'update_panel');
  return parsed.parsedData;
} 