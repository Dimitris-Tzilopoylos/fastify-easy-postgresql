export = Relation;
declare class Relation {
    constructor({ alias, from_table, to_table, from_column, to_column, type }: {
        alias: any;
        from_table: any;
        to_table: any;
        from_column: any;
        to_column: any;
        type: any;
    });
    alias: any;
    from_table: any;
    to_table: any;
    from_column: any;
    to_column: any;
    type: any;
}
