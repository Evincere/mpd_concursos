export interface ExamenDTO {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  maxScore: number;
  maxAttempts: number;
  attemptsUsed?: number;
  requirements: string[];
  rules: string[];
  allowedMaterials: string[];
  cancellationDetails?: {
    cancellationDate: string;
    violations: string[];
    reason?: string;
  };
}
