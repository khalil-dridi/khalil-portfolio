export interface PublicProfile {
  firstName: string | null;
  lastName: string | null;
  professionalTitle: string | null;
  biography: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  profileImageUrl: string | null;
  resumeUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  availability: boolean;
}

export interface AdminProfile extends PublicProfile {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpdateRequest {
  firstName: string | null;
  lastName: string | null;
  professionalTitle: string | null;
  biography: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  resumeUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  availability: boolean | null;
}

export interface ProfileImageResponse {
  imageUrl: string;
  contentType: string;
}
