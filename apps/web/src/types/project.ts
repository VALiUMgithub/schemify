/**
 * A project groups multiple import jobs together.
 * Matches the Prisma `Project` model.
 */
export interface Project {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: string;   // ISO 8601 date string
  updatedAt: string;
}

/** Payload sent to POST /projects */
export interface CreateProjectPayload {
  name: string;
  description?: string;
  userId: string;
}

/** Payload sent to PATCH /projects/:id */
export interface UpdateProjectPayload {
  name?: string;
  description?: string;
}
