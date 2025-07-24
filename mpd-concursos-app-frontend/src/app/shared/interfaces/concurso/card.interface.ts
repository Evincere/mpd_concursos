export interface Card {
    title: string;
    count: number;
    icon: string;
    color: string;
    description?: string; // ✅ Descripción opcional para mejor UX
    subtitle?: string; // ✅ Subtítulo opcional para información adicional contextual
}
