export = Migrations;
declare class Migrations {
    static migrationsFolder: string;
    static migrationsFolderExists(): boolean;
    static resolvePath(...entries: any[]): string;
    static createMigrationsFolder(): void;
    static setMigrationsFolder(name: any): void;
    static runNewMigration(cb: any): Promise<void>;
    static readMigrationFiles(): any[];
    static applyMigrations(): Promise<void>;
    static rollbackToMigration(id: any): Promise<void>;
    static createMigration({ up, down }: {
        up: any;
        down: any;
    }): Promise<void>;
    static bashMigrationInput(): Promise<void>;
}
