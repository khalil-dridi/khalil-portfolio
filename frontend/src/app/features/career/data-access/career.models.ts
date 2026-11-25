export interface Skill {
  id: number;
  name: string | null;
  category: string | null;
  level: string | null;
  icon: string | null;
  url: string | null;
}

export interface Experience {
  id: number;
  position: string | null;
  company: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  current: boolean | null;
  description: string | null;
  companyWebsite: string | null;
}

export interface Education {
  id: number;
  institution: string | null;
  degree: string | null;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
  current: boolean | null;
  description: string | null;
  institutionWebsite: string | null;
}

export interface CareerResponse {
  skills: Skill[];
  experiences: Experience[];
  education: Education[];
}

export type SkillRequest = Omit<Skill, 'id'>;
export type ExperienceRequest = Omit<Experience, 'id'>;
export type EducationRequest = Omit<Education, 'id'>;
