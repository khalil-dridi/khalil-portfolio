export interface TechnologyIcon {
  id: string;
  name: string;
  category: string;
  assetPath: string;
}

type IconDefinition = Omit<TechnologyIcon, 'assetPath'> & { variant: 'original' | 'plain' };

const definitions: IconDefinition[] = [
  { id: 'java', name: 'Java', category: 'Programming Languages', variant: 'plain' },
  { id: 'python', name: 'Python', category: 'Programming Languages', variant: 'plain' },
  { id: 'javascript', name: 'JavaScript', category: 'Programming Languages', variant: 'plain' },
  { id: 'typescript', name: 'TypeScript', category: 'Programming Languages', variant: 'plain' },
  { id: 'php', name: 'PHP', category: 'Programming Languages', variant: 'plain' },
  { id: 'c', name: 'C', category: 'Programming Languages', variant: 'original' },
  { id: 'cplusplus', name: 'C++', category: 'Programming Languages', variant: 'plain' },
  { id: 'csharp', name: 'C#', category: 'Programming Languages', variant: 'plain' },
  { id: 'dart', name: 'Dart', category: 'Programming Languages', variant: 'plain' },
  { id: 'go', name: 'Go', category: 'Programming Languages', variant: 'plain' },
  { id: 'kotlin', name: 'Kotlin', category: 'Programming Languages', variant: 'plain' },
  { id: 'ruby', name: 'Ruby', category: 'Programming Languages', variant: 'plain' },
  { id: 'angular', name: 'Angular', category: 'Frontend', variant: 'plain' },
  { id: 'react', name: 'React', category: 'Frontend', variant: 'original' },
  { id: 'vuejs', name: 'Vue.js', category: 'Frontend', variant: 'plain' },
  { id: 'html5', name: 'HTML5', category: 'Frontend', variant: 'plain' },
  { id: 'css3', name: 'CSS3', category: 'Frontend', variant: 'plain' },
  { id: 'sass', name: 'Sass', category: 'Frontend', variant: 'original' },
  { id: 'spring', name: 'Spring / Spring Boot', category: 'Backend', variant: 'original' },
  { id: 'nodejs', name: 'Node.js', category: 'Backend', variant: 'plain' },
  { id: 'express', name: 'Express', category: 'Backend', variant: 'original' },
  { id: 'django', name: 'Django', category: 'Backend', variant: 'plain' },
  { id: 'laravel', name: 'Laravel', category: 'Backend', variant: 'original' },
  { id: 'mysql', name: 'MySQL', category: 'Databases', variant: 'original' },
  { id: 'postgresql', name: 'PostgreSQL', category: 'Databases', variant: 'plain' },
  { id: 'mongodb', name: 'MongoDB', category: 'Databases', variant: 'plain' },
  { id: 'redis', name: 'Redis', category: 'Databases', variant: 'plain' },
  { id: 'oracle', name: 'Oracle', category: 'Databases', variant: 'original' },
  { id: 'sqlite', name: 'SQLite', category: 'Databases', variant: 'plain' },
  { id: 'docker', name: 'Docker', category: 'DevOps & Cloud', variant: 'plain' },
  { id: 'kubernetes', name: 'Kubernetes', category: 'DevOps & Cloud', variant: 'plain' },
  { id: 'jenkins', name: 'Jenkins', category: 'DevOps & Cloud', variant: 'plain' },
  { id: 'amazonwebservices', name: 'AWS', category: 'DevOps & Cloud', variant: 'plain' },
  { id: 'azure', name: 'Azure', category: 'DevOps & Cloud', variant: 'plain' },
  { id: 'githubactions', name: 'GitHub Actions', category: 'DevOps & Cloud', variant: 'plain' },
  { id: 'terraform', name: 'Terraform', category: 'DevOps & Cloud', variant: 'plain' },
  { id: 'nginx', name: 'Nginx', category: 'DevOps & Cloud', variant: 'original' },
  { id: 'git', name: 'Git', category: 'Tools', variant: 'plain' },
  { id: 'github', name: 'GitHub', category: 'Tools', variant: 'original' },
  { id: 'gitlab', name: 'GitLab', category: 'Tools', variant: 'plain' },
  { id: 'linux', name: 'Linux', category: 'Tools', variant: 'plain' },
  { id: 'intellij', name: 'IntelliJ IDEA', category: 'Tools', variant: 'plain' },
  { id: 'vscode', name: 'VS Code', category: 'Tools', variant: 'plain' },
  { id: 'maven', name: 'Maven', category: 'Tools', variant: 'plain' },
  { id: 'flutter', name: 'Flutter', category: 'Mobile', variant: 'plain' },
  { id: 'android', name: 'Android', category: 'Mobile', variant: 'plain' },
  { id: 'firebase', name: 'Firebase', category: 'Mobile', variant: 'plain' },
  { id: 'reactnative', name: 'React Native', category: 'Mobile', variant: 'original' },
];

export const TECHNOLOGY_ICONS: TechnologyIcon[] = definitions.map(({ variant, ...icon }) => ({
  ...icon,
  assetPath: `/assets/technology-icons/${icon.id}-${variant}.svg`,
}));

export const TECHNOLOGY_CATEGORIES = [
  'All technologies',
  'Programming Languages',
  'Frontend',
  'Backend',
  'Databases',
  'DevOps & Cloud',
  'Tools',
  'Mobile',
];

export function findTechnologyIcon(id: string): TechnologyIcon | undefined {
  return TECHNOLOGY_ICONS.find((icon) => icon.id === id);
}
