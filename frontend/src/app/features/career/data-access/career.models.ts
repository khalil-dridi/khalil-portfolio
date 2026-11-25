export interface Skill {
  id: number;
  name: string;
  category: string;
  level: string;
  icon: string;
  url: string;
}

export interface Experience {
  id: number;
  position: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  companyWebsite: string;
}

export interface Education {
  id: number;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  institutionWebsite: string;
}

export interface CareerResponse {
  skills: Skill[];
  experiences: Experience[];
  education: Education[];
}

export type SkillRequest = Omit<Skill, 'id'>;
export type ExperienceRequest = Omit<Experience, 'id'>;
export type EducationRequest = Omit<Education, 'id'>;
