/**
 * HTTP client for the Open Dental REST API.
 *
 * Open Dental API reference:
 *   - Local mode: http://localhost:30222/api/v1/
 *   - Auth: Authorization: ODFHIR {developerKey}/{customerKey}
 *   - PascalCase field names throughout
 *   - Pagination: ?Offset=N, max 100 items per request (1000 in local mode)
 *
 * Uses built-in fetch (Node 18+).
 */

import {
  mapODPatient,
  mapODAppointment,
  mapODProvider,
  mapODInsurancePlan,
  mapODClaim,
  mapODRecall,
  type MappedPatient,
  type MappedAppointment,
  type MappedProvider,
  type MappedInsurancePlan,
  type MappedInsuranceClaim,
  type MappedRecallTask,
} from './mapper';

export interface OpenDentalConfig {
  serverUrl: string;
  developerKey: string;
  customerKey: string;
}

export interface ODRequestParams {
  Offset?: number;
  [key: string]: string | number | boolean | undefined;
}

export class OpenDentalClient {
  private baseUrl: string;
  private authHeader: string;

  constructor(config: OpenDentalConfig) {
    // Ensure base URL ends with /api/v1 and no trailing slash
    let url = config.serverUrl.replace(/\/+$/, '');
    if (!url.endsWith('/api/v1')) {
      url = url.replace(/\/api\/v1\/?$/, '');
      url += '/api/v1';
    }
    this.baseUrl = url;
    this.authHeader = `ODFHIR ${config.developerKey}/${config.customerKey}`;
  }

  // ----------------------------------------------------------------
  // Internal HTTP helpers
  // ----------------------------------------------------------------

  private buildUrl(path: string, params?: ODRequestParams): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT',
    path: string,
    params?: ODRequestParams,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = this.buildUrl(path, params);

    const headers: Record<string, string> = {
      Authorization: this.authHeader,
      'Content-Type': 'application/json',
    };

    const init: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(15_000), // 15 second timeout
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new OpenDentalError(
        `Open Dental API error: ${response.status} ${response.statusText}`,
        response.status,
        text
      );
    }

    // Some endpoints return empty body on success
    const text = await response.text();
    if (!text) return {} as T;

    return JSON.parse(text) as T;
  }

  private async get<T>(path: string, params?: ODRequestParams): Promise<T> {
    return this.request<T>('GET', path, params);
  }

  private async post<T>(
    path: string,
    body: Record<string, unknown>,
    params?: ODRequestParams
  ): Promise<T> {
    return this.request<T>('POST', path, params, body);
  }

  // ----------------------------------------------------------------
  // Patients
  // ----------------------------------------------------------------

  async getPatients(params?: ODRequestParams): Promise<MappedPatient[]> {
    const raw = await this.get<Record<string, unknown>[]>('/patients', params);
    return Array.isArray(raw) ? raw.map(mapODPatient) : [];
  }

  async getPatient(patNum: string | number): Promise<MappedPatient> {
    const raw = await this.get<Record<string, unknown>>(`/patients/${patNum}`);
    return mapODPatient(raw);
  }

  // ----------------------------------------------------------------
  // Appointments
  // ----------------------------------------------------------------

  async getAppointments(params?: ODRequestParams): Promise<MappedAppointment[]> {
    const raw = await this.get<Record<string, unknown>[]>('/appointments', params);
    return Array.isArray(raw) ? raw.map(mapODAppointment) : [];
  }

  async getAppointment(aptNum: string | number): Promise<MappedAppointment> {
    const raw = await this.get<Record<string, unknown>>(`/appointments/${aptNum}`);
    return mapODAppointment(raw);
  }

  // ----------------------------------------------------------------
  // Procedure Logs
  // ----------------------------------------------------------------

  async getProcedureLogs(params?: ODRequestParams): Promise<Record<string, unknown>[]> {
    const raw = await this.get<Record<string, unknown>[]>('/procedurelogs', params);
    return Array.isArray(raw) ? raw : [];
  }

  // ----------------------------------------------------------------
  // Providers
  // ----------------------------------------------------------------

  async getProviders(): Promise<MappedProvider[]> {
    const raw = await this.get<Record<string, unknown>[]>('/providers');
    return Array.isArray(raw) ? raw.map(mapODProvider) : [];
  }

  // ----------------------------------------------------------------
  // Insurance Plans
  // ----------------------------------------------------------------

  async getInsurancePlans(params?: ODRequestParams): Promise<MappedInsurancePlan[]> {
    const raw = await this.get<Record<string, unknown>[]>('/insplans', params);
    return Array.isArray(raw) ? raw.map(mapODInsurancePlan) : [];
  }

  // ----------------------------------------------------------------
  // Claims
  // ----------------------------------------------------------------

  async getClaims(params?: ODRequestParams): Promise<MappedInsuranceClaim[]> {
    const raw = await this.get<Record<string, unknown>[]>('/claims', params);
    return Array.isArray(raw) ? raw.map(mapODClaim) : [];
  }

  // ----------------------------------------------------------------
  // Recalls
  // ----------------------------------------------------------------

  async getRecalls(params?: ODRequestParams): Promise<MappedRecallTask[]> {
    const raw = await this.get<Record<string, unknown>[]>('/recalls', params);
    return Array.isArray(raw) ? raw.map(mapODRecall) : [];
  }

  // ----------------------------------------------------------------
  // Procedure Notes
  // ----------------------------------------------------------------

  async writeProcNote(
    patNum: string | number,
    procNum: string | number,
    note: string,
    sign?: boolean
  ): Promise<Record<string, unknown>> {
    return this.post<Record<string, unknown>>('/procnotes', {
      PatNum: Number(patNum),
      ProcNum: Number(procNum),
      Note: note,
      ...(sign !== undefined && { Signature: sign ? 'true' : 'false' }),
    });
  }

  // ----------------------------------------------------------------
  // Connection test
  // ----------------------------------------------------------------

  async testConnection(): Promise<boolean> {
    try {
      await this.get('/patients', { Offset: 0, limit: 1 });
      return true;
    } catch {
      return false;
    }
  }
}

// ----------------------------------------------------------------
// Custom error class
// ----------------------------------------------------------------

export class OpenDentalError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public responseBody: string
  ) {
    super(message);
    this.name = 'OpenDentalError';
  }
}
