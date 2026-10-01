import { supabase } from './supabaseClient';
import { getAccessMetadata } from './accessMetadata';

export interface UserAccessLog {
  id: string;
  user_id: string;
  accessed_at: string;
  ip_address: string | null;
  user_agent: string | null;
  device_info: string | null;
}

interface AccessLogParams {
  requesterId: string;
  targetUserId: string;
  limit?: number;
}

export class UserAccessLogsError extends Error {
  code?: string;
  details?: string;
  hint?: string;

  constructor(message: string, options?: { code?: string; details?: string; hint?: string }) {
    super(message);
    this.name = 'UserAccessLogsError';
    this.code = options?.code;
    this.details = options?.details;
    this.hint = options?.hint;
  }
}

const sortLogsByDate = (logs: UserAccessLog[]): UserAccessLog[] =>
  [...logs].sort(
    (first, second) =>
      new Date(second.accessed_at).getTime() - new Date(first.accessed_at).getTime()
  );

class UserAccessLogService {
  async trackSuccessfulAccess(userId: string): Promise<void> {
    const { deviceInfo, userAgent } = getAccessMetadata();

    const { error } = await supabase.rpc('log_user_access', {
      p_device_info: deviceInfo,
      p_user_agent: userAgent,
      p_user_id: userId
    });

    if (error) {
      console.warn('Impossibile registrare l\'accesso utente:', error);
    }
  }

  async getUserAccessLogs({
    requesterId,
    targetUserId,
    limit = 100
  }: AccessLogParams): Promise<UserAccessLog[]> {
    const { data, error } = await supabase.rpc('get_user_access_logs', {
      p_limit: limit,
      p_requester_id: requesterId,
      p_target_user_id: targetUserId
    });

    if (error) {
      throw new UserAccessLogsError(error.message || 'Errore nel recupero dello storico accessi', {
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    }

    return sortLogsByDate((data as UserAccessLog[] | null) || []);
  }
}

export const userAccessLogService = new UserAccessLogService();
