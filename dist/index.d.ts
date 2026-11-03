export interface Theme { readonly id: string; readonly name: string; readonly mode: 'light' | 'dark'; readonly tokens: Readonly<Record<string,string>>; }
export declare const themes: {readonly light: Theme; readonly dark: Theme};
export declare const light: Theme;
export declare const dark: Theme;
export declare const version: string;
export declare const heritage: Readonly<Record<string,string>>;
export declare const design: { readonly "radius": Readonly<Record<string,string>>; readonly "spacing": Readonly<Record<string,string>>; readonly "fonts": Readonly<Record<string,string>>; readonly "widths": Readonly<Record<string,string>>; readonly "shadows": Readonly<Record<string,string>>; readonly "motion": Readonly<Record<string,string>>; };
export declare const foundation: { readonly origin: string; readonly sourceRepository: string; readonly sourceCommit: string;  readonly tokens: Readonly<Record<string,string>>; readonly typographyRoles: Readonly<Record<string,unknown>> };
export declare const layout: {readonly schemaVersion: number; readonly primitives: readonly string[]; readonly compositions: readonly string[]; readonly defaults: Readonly<Record<string,string | number>>; readonly tokens: Readonly<Record<string,string>>; readonly sources: readonly {readonly url: string; readonly repository: string; readonly commit: string; readonly files: readonly string[]}[]; readonly normalization: Readonly<Record<string,string>>};
export declare const capabilities: Readonly<Record<string,unknown>>;
export default themes;
