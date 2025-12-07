
export enum ServiceType {
    REVISION = "Revisão",
    MECHANICS = "Mecânica",
    ELECTRIC = "Elétrica",
    STERN_DRIVE = "Rabeta",
    INSTALLATION = "Instalação",
    OTHERS = "Outros"
}

export enum TimeEstimate {
    MIN_30 = "30 min",
    HOUR_1 = "1h",
    HOUR_1_30 = "1h 30m",
    HOUR_2 = "2h",
    HOUR_2_30 = "2h 30m",
    HOUR_3 = "3h",
    HOUR_3_30 = "3h 30m",
    HALF_DAY = "4h (Meio Período)",
    ONE_DAY = "1 dia",
    TWO_DAYS = "2 dias",
    THREE_DAYS = "3 dias"
}

export enum ExecutionMode {
    WORKSHOP = "Oficina",
    VESSEL = "Embarcação",
    BOTH = "Ambos"
}

export enum Priority {
    HIGH = "Alta",
    MEDIUM = "Média",
    LOW = "Baixa"
}

export enum Status {
    TODO = "A Fazer",
    IN_PROGRESS = "Em Progresso",
    DONE = "Finalizado"
}

export enum Period {
    MORNING = "Manhã",
    AFTERNOON = "Tarde",
    NIGHT = "Noite"
}

export interface Technician {
    id: string;
    name: string;
    color: string; // Hex code for border/badge
    initials: string;
}

export interface Service {
    id: string;
    serviceName: string;
    type: ServiceType;
    timeEstimate: TimeEstimate;
    location: string;
    execution: ExecutionMode;
    priority: Priority;
    status: Status;
    observations: string;
    scheduledDate?: string; // Format YYYY-MM-DD
    scheduledPeriod?: Period;

    defaultTechnicianId?: string; // The main tech assigned

    // Map of segment index to specific slot override AND technician override
    customAllocations?: Record<number, {
        date: string,
        period: Period,
        technicianId?: string // Allow overriding tech for this specific block
    }>;

    createdAt: number;
}
