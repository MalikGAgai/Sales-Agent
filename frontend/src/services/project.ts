import {
  Project,
  ProjectCreateRequest,
  ProjectDetail,
  ProjectListParams,
  ProjectListResponse,
  ProjectUpdateRequest,
} from "@/types/project";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export const projectService = {
  /** Create a new client website project */
  async createProject(data: ProjectCreateRequest): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Project>(res);
  },

  /** List projects with optional search, filter, sort, and pagination */
  async listProjects(params: ProjectListParams = {}): Promise<ProjectListResponse> {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.status && params.status !== "all") query.set("status", params.status);
    if (params.industry && params.industry !== "all") query.set("industry", params.industry);
    if (params.country && params.country !== "all") query.set("country", params.country);
    if (params.sort_by) query.set("sort_by", params.sort_by);
    if (params.sort_order) query.set("sort_order", params.sort_order);
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));

    const res = await fetch(`${API_BASE}/projects?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<ProjectListResponse>(res);
  },

  /** Get a single project with audit logs */
  async getProject(id: string): Promise<ProjectDetail> {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<ProjectDetail>(res);
  },

  /** Update project fields (partial update) */
  async updateProject(id: string, data: ProjectUpdateRequest): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Project>(res);
  },

  /** Soft-delete a project */
  async deleteProject(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },
};
