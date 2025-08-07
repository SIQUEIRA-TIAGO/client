export interface OcurrenceData {
    occurence: Occurence;
    observer: Observer;
  }
  
  interface Occurence {
    affectedRows: AffectedRows;
    affectedFields: AffectedRows;
    meta: Meta;
  }
  
  interface Observer {
    observerId: string;
  }
  
  interface Meta {
    executionMS: number;
    totalRowsCount: number;
    executionDate: string;
  }
  
  interface AffectedRows {
    result: any[];
    count: number;
  }