export type LegacyGymSession = {
  userId: string;
  sessionDate: string;
  exercises: string[];
  notesRaw?: string;
  createdAt: string;
  updatedAt: string;
};

export type Exercise = {
  exerciseId: string;
  name: string;
  nameLower: string;
  aliases: string[];
  iconKey?: string;
  usageCount?: number;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
};

export type Location = {
  locationId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type SessionExerciseItem = {
  exerciseId: string;
  notes?: string;
};

export type GymSessionV2 = {
  userId: string;
  sessionDate: string;
  locationId: string;
  exerciseItems: SessionExerciseItem[];
  notesRaw?: string;
  createdAt: string;
  updatedAt: string;
};

export type GymSessionView = {
  userId: string;
  sessionDate: string;
  locationId: string;
  locationName: string;
  exerciseItems: Array<{
    exerciseId: string;
    name: string;
    notes?: string;
  }>;
  notesRaw?: string;
  createdAt: string;
  updatedAt: string;
};

export type BackupSnapshot = {
  exportedAt: string;
  userId: string;
  sessionsV1: LegacyGymSession[];
  sessionsV2: GymSessionV2[];
  exercises: Exercise[];
  locations: Location[];
};

export type BackupRecord = {
  userId: string;
  backupId: string;
  createdAt: string;
  schemaVersion: number;
  summary: {
    sessionsV1: number;
    sessionsV2: number;
    exercises: number;
    locations: number;
  };
  payload: string;
};
