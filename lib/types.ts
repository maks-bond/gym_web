export type GymSession = {
  userId: string;
  sessionDate: string;
  exercises: string[];
  notesRaw?: string;
  createdAt: string;
  updatedAt: string;
};
