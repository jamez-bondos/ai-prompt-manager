export interface Template {
  id: string;
  title: string;
  content: string;
  link?: string;
}

export interface Variable {
  name: string;
  value: string;
}

export interface TemplateWithVariables extends Template {
  variables: Variable[];
} 