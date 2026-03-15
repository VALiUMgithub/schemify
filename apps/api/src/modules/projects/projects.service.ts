import { ProjectsRepository } from './projects.repository';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

export class ProjectsService {
  private repository: ProjectsRepository;

  constructor() {
    this.repository = new ProjectsRepository();
  }

  async createProject(data: CreateProjectDto) {
    // Basic business logic validation goes here
    if (!data.name || !data.userId) {
      throw new Error('Project name and userId are required');
    }
    return await this.repository.createProject(data);
  }

  async listProjects() {
    return await this.repository.getProjects();
  }

  async getProject(id: string) {
    const project = await this.repository.getProjectById(id);
    if (!project) throw new Error('Project not found');
    return project;
  }

  async updateProject(id: string, data: UpdateProjectDto) {
    return await this.repository.updateProject(id, data);
  }

  async deleteProject(id: string) {
    return await this.repository.deleteProject(id);
  }
}
