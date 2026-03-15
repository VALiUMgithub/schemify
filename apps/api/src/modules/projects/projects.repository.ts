import { prisma } from '../../config/prisma';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

export class ProjectsRepository {
  async createProject(data: CreateProjectDto) {
    return await prisma.project.create({
      data,
    });
  }

  async getProjects() {
    return await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProjectById(id: string) {
    return await prisma.project.findUnique({
      where: { id },
    });
  }

  async updateProject(id: string, data: UpdateProjectDto) {
    return await prisma.project.update({
      where: { id },
      data,
    });
  }

  async deleteProject(id: string) {
    return await prisma.project.delete({
      where: { id },
    });
  }
}
