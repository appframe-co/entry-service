import { Application } from "express";

export type RoutesInput = {
  app: Application,
}

export type TErrorResponse = {
  error: string|null;
  description?: string;
  property?: string;
}

export type TDoc = {[key: string]: any}

export type TEntryModel = {
  id: string;
  projectId: string;
  userId: string;
  structureId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  doc: TDoc;
  sectionIds: string[];
}

export type TSectionModel = {
  id: string;
  projectId: string;
  userId: string;
  structureId: string;
  parentId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  doc: TDoc;
}

export type TEntry = {
  id: string;
  projectId: string;
  structureId: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy: string;
  updatedBy: string;
  doc: TDoc;
  sectionIds: string[];
}

export type TSection = {
  id: string;
  projectId: string;
  structureId: string;
  parentId: string|null;
  createdAt?: string;
  updatedAt?: string;
  createdBy: string;
  updatedBy: string;
  doc: TDoc;
}

export type TEntryInput = {
	id?: string;
	userId: string; 
	projectId: string;
	structureId: string;
	doc?: TDoc;
  sectionIds?: string[]|string;
}

export type TSectionInput = {
	id?: string;
	userId: string; 
	projectId: string;
	structureId: string;
  parentId?: string;
	doc?: TDoc;
}

export type TFile = {
  id: string;
  filename: string;
  uuidName: string;
  width: number;
  height: number;
  size: number;
  mimeType: string;
  contentType: string;
  src: string;
}

export type TTranslations = {
  enabled: boolean;
}
export type TSections = {
  enabled: boolean;
  bricks: TBrick[];
}
export type TNotifications = {
  new: {
      alert: {
        enabled: boolean;
        message: string;
      }
  }
}
export type TStructure = {
  id: string;
  name: string;
  code: string;
  bricks: TBrick[];
  sections: TSections;
  translations: TTranslations;
  notifications: TNotifications;
}

type TBrick = {
  type: string;
  name: string;
  key: string;
  description: string;
  validations: TValidationBrick[];
}

type TValidationBrick = {
  code: string;
  value: any;
}

export type TParameters = {
  limit?: number;
  page?: number;
  sinceId?: string;
  ids?: string;
  section_id?: string;
  parent_id?: string;
}

type TMinNum = number | [number, string];
type TMinDate = Date | [Date, string];

export type TOptions = {
  required?: boolean | [boolean, string];
  unique?: boolean | [boolean, string];
  max?: TMinNum|TMinDate;
  min?: TMinNum|TMinDate;
  regex?: string | [string, string];
  choices?: string[]|number[];
  defaultValue?: any;
  value?: [string, any];
  max_precision?: number;
}

export type TValueTranslation = {[key: string]: any}

export type TTranslationModel = {
  id: string;
  userId: string; 
  projectId: string;
  structureId: string;
  subjectId: string;
  subject: string;
  key: string;
  value: TValueTranslation;
  lang: string;
  createdAt: string;
}

export type TTranslation = {
  id: string;
	userId: string; 
  projectId: string;
  structureId: string;
  subjectId: string;
  subject: string;
  key: string;
  value: TValueTranslation;
  lang: string;
  createdAt?: string;
}

export type TTranslationInput = {
  id?: string;
	userId: string; 
  projectId: string;
  structureId: string;
  subjectId: string;
  subject: string;
  key: string;
  value: TValueTranslation;
  lang: string;
}