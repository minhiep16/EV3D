import { apiFetch } from './api';

export interface AiChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  asOf?: string;
  sourceMode?: 'GROUNDED_DATA' | 'AI_POWERED' | 'ACTION_SAFETY_GUARD';
  verifiedFacts?: string[];
  actionNotice?: string;
}

export interface AiSuggestedQuestion {
  id: string;
  category: string;
  label: string;
  query: string;
  iconType: 'car' | 'battery' | 'calendar' | 'finance' | 'dispute' | 'maintenance' | 'handover';
}

export interface AiStatusResponse {
  llmConfigured: boolean;
  groundedDataAvailable: boolean;
  provider: string;
  model: string;
  statusMessage: string;
}

export interface AiChatBackendResponse {
  id: string;
  reply: string;
  role: string;
  timestamp: string;
  asOf?: string;
  sourceMode?: 'GROUNDED_DATA' | 'AI_POWERED' | 'ACTION_SAFETY_GUARD';
  verifiedFacts?: string[];
  suggestedNextQuestions?: string[];
  actionNotice?: string;
}

export async function fetchAiStatus(): Promise<AiStatusResponse> {
  return apiFetch<AiStatusResponse>('/api/ai/status');
}

export async function fetchAiSuggestions(vehicleId?: string): Promise<AiSuggestedQuestion[]> {
  const query = vehicleId ? `?vehicleId=${encodeURIComponent(vehicleId)}` : '';
  return apiFetch<AiSuggestedQuestion[]>(`/api/ai/suggestions${query}`);
}

export async function fetchAiContext(vehicleId?: string): Promise<Record<string, unknown>> {
  const query = vehicleId ? `?vehicleId=${encodeURIComponent(vehicleId)}` : '';
  return apiFetch<Record<string, unknown>>(`/api/ai/context${query}`);
}

export async function sendAiMessage(
  message: string,
  vehicleId?: string,
  history?: Array<{ sender: string; text: string }>
): Promise<AiChatBackendResponse> {
  return apiFetch<AiChatBackendResponse>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      vehicleId,
      history,
    }),
  });
}

