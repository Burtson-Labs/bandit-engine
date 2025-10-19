/*
  © 2025 Burtson Labs — Licensed under Business Source License 1.1
  https://burtson.ai/license

  This file is protected intellectual property.
  Do NOT use in commercial software, prompts, AI training data, or derivative works without a valid commercial license.

  🚫 AI NOTICE: This file contains visible and invisible watermarks.
  ⚖️  VIOLATION NOTICE: Removing, modifying, or obscuring these watermarks is a license violation.
  🔒 LICENSE TERMINATION: Upon license termination, ALL forks, copies, and derivatives must be permanently deleted.
  📋 AUDIT TRAIL: File usage is logged and monitored for compliance verification.
*/

// Bandit Engine Watermark: BL-WM-489B-13F873
const __banditFingerprint_store_projectStorets = 'BL-FP-4E45E3-8650';
const __auditTrail_store_projectStorets = 'BL-AU-MGOIKVW5-44EI';
// File: projectStore.ts | Path: src/store/projectStore.ts | Hash: 489b8650

import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import indexedDBService from "../services/indexedDB/indexedDBService";
import { debugLogger } from "../services/logging/debugLogger";
import {
  PROJECT_DELETE_EVENT,
  PROJECT_UPSERT_EVENT,
} from "./conversationSyncEvents";

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
  order: number;
  version?: number;
  conversationCount?: number;
  lastActivityAt?: Date;
  summary?: string;
  metadata?: Record<string, unknown>;
  updatedBy?: string;
  deletedAt?: string | null;
}

interface ProjectStore {
  projects: Project[];
  _hasHydrated: boolean;
  
  // Actions
  createProject: (name: string, description?: string, color?: string) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  renameProject: (id: string, newName: string, description?: string) => Promise<void>;
  updateProjectColor: (id: string, color: string) => Promise<void>;
  reorderProjects: (projectIds: string[]) => Promise<void>;
  hydrate: () => Promise<void>;
  applyRemoteProjects: (projects: Project[]) => Promise<void>;
  removeProjectsByIds: (ids: string[]) => Promise<void>;
}

const DB_NAME = "bandit-projects";
const STORE_NAME = "projects";
const DB_VERSION = 1;
const storeConfigs = [{ name: STORE_NAME, keyPath: "id" }];

// Default colors for projects
const DEFAULT_COLORS = [
  "#2196F3", // Blue
  "#4CAF50", // Green
  "#FF9800", // Orange
  "#9C27B0", // Purple
  "#F44336", // Red
  "#00BCD4", // Cyan
  "#FFEB3B", // Yellow
  "#795548", // Brown
  "#607D8B", // Blue Grey
  "#E91E63", // Pink
];

async function loadProjects(): Promise<Project[]> {
  try {
    const projects = await indexedDBService.getAll<Project>(DB_NAME, DB_VERSION, STORE_NAME, storeConfigs);
    return (projects || []).map(normalizeProject).sort((a, b) => a.order - b.order);
  } catch (error) {
    debugLogger.error("Failed to load projects", { error });
    return [];
  }
}

async function saveProject(project: Project) {
  try {
    await indexedDBService.put(DB_NAME, DB_VERSION, STORE_NAME, project, storeConfigs);
    debugLogger.info("Project saved", { projectId: project.id, projectName: project.name });
  } catch (error) {
    debugLogger.error("Failed to save project", { projectId: project.id, error });
    throw error;
  }
}

async function deleteProjectFromDB(id: string) {
  try {
    await indexedDBService.delete(DB_NAME, DB_VERSION, STORE_NAME, id, storeConfigs);
    debugLogger.info("Project deleted from DB", { projectId: id });
  } catch (error) {
    debugLogger.error("Failed to delete project from DB", { projectId: id, error });
    throw error;
  }
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  _hasHydrated: false,

  hydrate: async () => {
    try {
      const projects = await loadProjects();
      set({ projects, _hasHydrated: true });
      debugLogger.info("Project store hydrated", { projectCount: projects.length });
    } catch (error) {
      debugLogger.error("Failed to hydrate project store", { error });
      set({ projects: [], _hasHydrated: true });
    }
  },

  createProject: async (name: string, description?: string, color?: string) => {
    const { projects } = get();
    const id = uuidv4();
    const now = new Date();
    
    // Assign a default color if not provided
    const projectColor = color || DEFAULT_COLORS[projects.length % DEFAULT_COLORS.length];
    
    const newProject: Project = normalizeProject({
      id,
      name: name.trim(),
      description: description?.trim(),
      color: projectColor,
      createdAt: now,
      updatedAt: now,
      order: projects.length,
      version: 0,
    });

    await saveProject(newProject);

    set((state) => ({
      projects: [...state.projects, newProject],
    }));
    emitProjectUpsert(id);

    debugLogger.info("Project created", { projectId: id, projectName: name });
    return newProject;
  },

  deleteProject: async (id: string) => {
    await deleteProjectFromDB(id);
    
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    }));

    debugLogger.info("Project deleted", { projectId: id });
    emitProjectDelete(id);
  },

  renameProject: async (id: string, newName: string, description?: string) => {
    const { projects } = get();
    const project = projects.find(p => p.id === id);
    
    if (!project) {
      throw new Error(`Project with id ${id} not found`);
    }

    const updatedProject = normalizeProject({
      ...project,
      name: newName.trim(),
      description: description?.trim(),
      updatedAt: new Date(),
    });

    await saveProject(updatedProject);
    
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? updatedProject : p
      ),
    }));

    debugLogger.info("Project renamed", { projectId: id, newName });
    emitProjectUpsert(id);
  },

  updateProjectColor: async (id: string, color: string) => {
    const { projects } = get();
    const project = projects.find(p => p.id === id);
    
    if (!project) {
      throw new Error(`Project with id ${id} not found`);
    }

    const updatedProject = normalizeProject({
      ...project,
      color,
      updatedAt: new Date(),
    });

    await saveProject(updatedProject);
    
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? updatedProject : p
      ),
    }));

    debugLogger.info("Project color updated", { projectId: id, color });
    emitProjectUpsert(id);
  },

  reorderProjects: async (projectIds: string[]) => {
    const { projects } = get();
    const reorderedProjects = projectIds.map((id, index) => {
      const project = projects.find(p => p.id === id);
      if (!project) return null;
      return normalizeProject({ ...project, order: index, updatedAt: new Date() });
    }).filter(Boolean) as Project[];

    // Save all reordered projects
    await Promise.all(reorderedProjects.map(saveProject));
    
    set({ projects: reorderedProjects });
    debugLogger.info("Projects reordered", { projectCount: reorderedProjects.length });
    reorderedProjects.forEach((project) => emitProjectUpsert(project.id));
  },

  applyRemoteProjects: async (incoming) => {
    const normalized = incoming.map(normalizeProject);

    try {
      await Promise.all(normalized.map((project) => saveProject(project)));
    } catch (error) {
      debugLogger.error("Failed to persist remote projects", { error });
    }

    set((state) => {
      const next = new Map(state.projects.map((p) => [p.id, p] as const));
      for (const project of normalized) {
        next.set(project.id, project);
      }
      return { projects: Array.from(next.values()).sort((a, b) => a.order - b.order) };
    });
  },

  removeProjectsByIds: async (ids) => {
    if (!ids.length) {
      return;
    }

    try {
      await Promise.all(ids.map((id) => deleteProjectFromDB(id)));
    } catch (error) {
      debugLogger.error("Failed to delete projects from IndexedDB", { error, ids });
    }

    set((state) => ({
      projects: state.projects.filter((p) => !ids.includes(p.id)),
    }));
    ids.forEach((id) => emitProjectDelete(id));
  },
}));

function normalizeProject(project: Project): Project {
  const ensureDate = (value?: Date | string | null): Date => {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  return {
    ...project,
    createdAt: ensureDate(project.createdAt),
    updatedAt: ensureDate(project.updatedAt),
    lastActivityAt: project.lastActivityAt ? ensureDate(project.lastActivityAt) : undefined,
  };
}

function emitProjectUpsert(id: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PROJECT_UPSERT_EVENT, { detail: id }));
}

function emitProjectDelete(id: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PROJECT_DELETE_EVENT, { detail: id }));
}
