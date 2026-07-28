import { supabase } from './supabase';

export type MemberStoragePayload = Record<string, unknown>;

function isSchemaError(error?: { message?: string | null } | null) {
  const message = error?.message?.toLowerCase() ?? '';
  return (
    message.includes('does not exist') ||
    message.includes('column') ||
    message.includes('permission denied') ||
    message.includes('violates row-level security policy')
  );
}

function buildLegacyPayload(payload: MemberStoragePayload) {
  const legacyPayload: MemberStoragePayload = {
    name: payload.name ?? '',
    email: payload.email ?? '',
    phone: payload.phone ?? '',
    address: payload.address ?? '',
    membership_date: payload.membership_date ?? null,
    membership_expiry: payload.membership_expiry ?? null,
    status: payload.status ?? 'active',
    notes: payload.notes ?? '',
    updated_at: new Date().toISOString(),
  };

  if (payload.created_at) legacyPayload.created_at = payload.created_at;

  const extraFields = Object.entries(payload).filter(([key]) => ![
    'id', 'name', 'email', 'phone', 'address', 'membership_date', 'membership_expiry',
    'status', 'notes', 'created_at', 'updated_at', 'user_id', 'role'
  ].includes(key));

  if (extraFields.length > 0) {
    const serializedExtras = JSON.stringify(Object.fromEntries(extraFields));
    const existingNotes = typeof payload.notes === 'string' && payload.notes.trim()
      ? `${payload.notes}\n${serializedExtras}`
      : serializedExtras;
    legacyPayload.notes = existingNotes;
  }

  return legacyPayload;
}

async function saveMemberWithFallback(payload: MemberStoragePayload, mode: 'insert' | 'update', id?: string) {
  const fullPayload = {
    ...payload,
    updated_at: new Date().toISOString(),
  };

  const request = mode === 'insert'
    ? supabase.from('members').insert(fullPayload)
    : supabase.from('members').update(fullPayload).eq('id', id!);

  const { error } = await request;
  if (!error) {
    return { success: true as const, error: null };
  }

  if (!isSchemaError(error)) {
    return { success: false as const, error };
  }

  const fallbackPayload = buildLegacyPayload(payload);
  const fallbackRequest = mode === 'insert'
    ? supabase.from('members').insert(fallbackPayload)
    : supabase.from('members').update(fallbackPayload).eq('id', id!);

  const fallbackResult = await fallbackRequest;

  if (fallbackResult.error) {
    return { success: false as const, error: fallbackResult.error };
  }

  return { success: true as const, error: null, usedFallback: true };
}

export async function createMemberProfile(payload: MemberStoragePayload) {
  return saveMemberWithFallback(payload, 'insert');
}

export async function updateMemberProfile(id: string, payload: MemberStoragePayload) {
  return saveMemberWithFallback(payload, 'update', id);
}
