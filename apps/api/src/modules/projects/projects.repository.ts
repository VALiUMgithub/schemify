import { prisma } from '../../config/prisma';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

export class ProjectsRepository {
  private async ensureDemoUser(userId: string = 'demo-user') {
    // Quick and dirty way to make sure the user exists so foreign keys don't fail for the demo
    await prisma.user.upsert({
      where: { email: `${userId}@example.com` },
      update: {},
      create: {
        id: userId,
        email: `${userId}@example.com`,
        name: 'Demo User'
      }
    });
  }

  async createProject(data: CreateProjectDto) {
    if (data.userId) {
      await this.ensureDemoUser(data.userId);
    }
    return await prisma.project.create({
      data,
    });
  }

  async getProjects() {
    await this.ensureDemoUser('demo-user');
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
