export interface Project {
  id: number;
  title: string;
  description: string;
  technologies: string | null;
  backgroundImageUrl: string | null;
  demoVideoUrl: string | null;
  githubUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
}
