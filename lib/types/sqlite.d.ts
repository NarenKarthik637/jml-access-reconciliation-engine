declare module 'node:sqlite' {
  export class DatabaseSync {
    constructor(location: string, options?: any);
    exec(sql: string): void;
    prepare(sql: string): {
      run(...params: any[]): { changes: number | bigint; lastInsertRowid: number | bigint };
      get(...params: any[]): any;
      all(...params: any[]): any[];
    };
    close(): void;
  }
}
