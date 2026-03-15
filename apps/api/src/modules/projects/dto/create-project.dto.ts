export interface CreateProjectDto {
  name: string;
  description?: string;
  userId: string; // Used to attach the project to a specific user
}
