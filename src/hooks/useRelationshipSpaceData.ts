import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { withTimeout } from '@/lib/async';
import { memorySchema, reportSchema, weeklyCheckinSchema } from '@/lib/schemas';
import { buildMemorySearchResult, buildMilestoneSummary, buildMonthlyRecap } from '@/lib/relationship-ai';
import {
  canGrantPermissionAtStage,
  getCooldownLabel,
  getNextStage,
  hasLivePermission,
  HEARTPATH_PERMISSION_CATALOG,
  isOpenStageRequest,
  SHARED_PERMISSION_NAMES,
  startOfCurrentWeek,
  type HeartPathPermissionName,
} from '@/lib/heartpath';
import type { Tables } from '@/integrations/supabase/types';

type RelationshipRow = Tables<'relationships'>;
type UserRow = Tables<'users'>;
type PermissionRow = Tables<'relationship_permissions'>;
type MemoryRow = Tables<'memories'>;
type CheckinRow = Tables<'weekly_checkins'>;
type SummaryRow = Tables<'ai_summaries'>;
type RelationshipEventRow = Tables<'relationship_events'>;
type ReportRow = Tables<'reports'>;

export interface RelationshipWithPartner extends RelationshipRow {
  partner: UserRow | null;
}

const ACTIVE_STATES = ['active', 'exclusive', 'paused'] as const;
const DISCOVERY_BLOCKING_STATES = ['pending', 'active', 'exclusive', 'paused', 'cooldown'] as const;

function pickPrimaryRelationship(relationships: RelationshipWithPartner[]) {
  const priority = ['exclusive', 'active', 'paused', 'cooldown'] as const;

  for (const state of priority) {
    const match = relationships.find((relationship) => relationship.lifecycle_state === state);
    if (match) return match;
  }

  return null;
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

export const useRelationshipSpaceData = () => {
  const { user } = useAuth();
  const [relationships, setRelationships] = useState<RelationshipWithPartner[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<RelationshipWithPartner[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<RelationshipWithPartner[]>([]);
  const [primaryRelationship, setPrimaryRelationship] = useState<RelationshipWithPartner | null>(null);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [memories, setMemories] = useState<MemoryRow[]>([]);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [aiSummaries, setAiSummaries] = useState<SummaryRow[]>([]);
  const [events, setEvents] = useState<RelationshipEventRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const createRelationshipEvent = async (
    relationshipId: string,
    eventType: RelationshipEventRow['event_type'],
    metadata: Record<string, unknown> = {}
  ) => {
    if (!user?.id) return;

    const { error } = await supabase.from('relationship_events').insert({
      relationship_id: relationshipId,
      actor_user_id: user.id,
      event_type: eventType,
      metadata,
    });

    if (error) {
      console.error('Error writing relationship event:', error);
    }
  };

  const fetchData = async (showLoader = true) => {
    if (!user?.id) {
      setRelationships([]);
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setPrimaryRelationship(null);
      setPermissions([]);
      setMemories([]);
      setCheckins([]);
      setAiSummaries([]);
      setEvents([]);
      setReports([]);
      setLoading(false);
      return;
    }

    try {
      if (showLoader) setLoading(true);

      const { data: relationshipRows, error: relationshipError } = await withTimeout(
        supabase
          .from('relationships')
          .select('*')
          .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
          .order('updated_at', { ascending: false }),
        10000,
        'Loading relationships'
      );

      if (relationshipError) {
        throw relationshipError;
      }

      const partnerIds = unique(
        (relationshipRows || [])
          .map((relationship) => (relationship.user_a === user.id ? relationship.user_b : relationship.user_a))
          .filter(Boolean) as string[]
      );

      let partnerMap = new Map<string, UserRow>();
      if (partnerIds.length > 0) {
        const { data: partnerRows, error: partnerError } = await withTimeout(
          supabase
            .from('users')
            .select('*')
            .in('id', partnerIds),
          8000,
          'Loading relationship partners'
        );

        if (partnerError) {
          throw partnerError;
        }

        partnerMap = new Map((partnerRows || []).map((partner) => [partner.id, partner]));
      }

      const mergedRelationships: RelationshipWithPartner[] = (relationshipRows || []).map((relationship) => {
        const partnerId = relationship.user_a === user.id ? relationship.user_b : relationship.user_a;
        return {
          ...relationship,
          partner: partnerId ? partnerMap.get(partnerId) || null : null,
        };
      });

      setRelationships(mergedRelationships);
      setIncomingRequests(
        mergedRelationships.filter(
          (relationship) => relationship.lifecycle_state === 'pending' && relationship.user_b === user.id
        )
      );
      setOutgoingRequests(
        mergedRelationships.filter(
          (relationship) => relationship.lifecycle_state === 'pending' && relationship.user_a === user.id
        )
      );

      const nextPrimaryRelationship = pickPrimaryRelationship(mergedRelationships);
      setPrimaryRelationship(nextPrimaryRelationship);

      if (!nextPrimaryRelationship?.id) {
        setPermissions([]);
        setMemories([]);
        setCheckins([]);
        setAiSummaries([]);
        setEvents([]);
        setReports([]);
        return;
      }

      const [permissionResponse, memoryResponse, checkinResponse, summaryResponse, eventResponse, reportResponse] = await withTimeout(
        Promise.all([
          supabase
            .from('relationship_permissions')
            .select('*')
            .eq('relationship_id', nextPrimaryRelationship.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('memories')
            .select('*')
            .eq('relationship_id', nextPrimaryRelationship.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('weekly_checkins')
            .select('*')
            .eq('relationship_id', nextPrimaryRelationship.id)
            .order('week_start', { ascending: false }),
          supabase
            .from('ai_summaries')
            .select('*')
            .eq('relationship_id', nextPrimaryRelationship.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('relationship_events')
            .select('*')
            .eq('relationship_id', nextPrimaryRelationship.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('reports')
            .select('*')
            .eq('relationship_id', nextPrimaryRelationship.id)
            .order('created_at', { ascending: false }),
        ]),
        10000,
        'Loading relationship space'
      );

      if (permissionResponse.error) throw permissionResponse.error;
      if (memoryResponse.error) throw memoryResponse.error;
      if (checkinResponse.error) throw checkinResponse.error;
      if (summaryResponse.error) throw summaryResponse.error;
      if (eventResponse.error) throw eventResponse.error;
      if (reportResponse.error) throw reportResponse.error;

      setPermissions(permissionResponse.data || []);
      setMemories(memoryResponse.data || []);
      setCheckins(checkinResponse.data || []);
      setAiSummaries(summaryResponse.data || []);
      setEvents(eventResponse.data || []);
      setReports(reportResponse.data || []);
    } catch (error) {
      console.error('Error fetching HeartPath relationship space:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    fetchData(true);
  }, [user?.id]);

  // Stable, sorted list of relationship ids the current user participates in.
  // Used to scope realtime subscriptions on per-relationship tables. Sorting
  // keeps the dependency string stable across re-renders even if the underlying
  // array order changes.
  const relationshipIdsKey = useMemo(
    () =>
      relationships
        .map((relationship) => relationship.id)
        .filter(Boolean)
        .sort()
        .join(','),
    [relationships]
  );

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const relationshipIds = relationshipIdsKey ? relationshipIdsKey.split(',') : [];

    const channel = supabase.channel(`heartpath-space-${user.id}`);

    // Always subscribe to relationships rows the user owns. This catches
    // brand-new pending requests inbound to this user (which won't be in
    // relationshipIds yet) as well as updates to existing relationships.
    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'relationships', filter: `user_a=eq.${user.id}` },
        () => void fetchData(false)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'relationships', filter: `user_b=eq.${user.id}` },
        () => void fetchData(false)
      );

    // Per-relationship tables are scoped by the in-list filter. Skip subscribing
    // when the user has no relationships -- there is nothing to update.
    if (relationshipIds.length > 0) {
      const inFilter = `relationship_id=in.(${relationshipIds.join(',')})`;
      const perRelationshipTables = [
        'relationship_permissions',
        'weekly_checkins',
        'ai_summaries',
        'memories',
        'reports',
      ] as const;

      for (const table of perRelationshipTables) {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table, filter: inFilter },
          () => void fetchData(false)
        );
      }
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, relationshipIdsKey]);

  const partner = primaryRelationship?.partner ?? null;
  const currentStage = primaryRelationship?.current_stage ?? primaryRelationship?.current_level ?? 1;
  const requestIsOpen = isOpenStageRequest(
    primaryRelationship?.requested_stage,
    primaryRelationship?.stage_request_status
  );
  const nextStage = getNextStage(currentStage);
  const isExclusive = primaryRelationship?.lifecycle_state === 'exclusive' || currentStage >= 6;
  const isPaused = primaryRelationship?.lifecycle_state === 'paused';
  const discoveryLocked = relationships.some(
    (relationship) => relationship.lifecycle_state === 'exclusive' || (relationship.current_stage ?? 1) >= 6
  );

  const myPermissions = permissions.filter((permission) => permission.granted_by === user?.id);
  const partnerPermissions = permissions.filter((permission) => permission.granted_to === user?.id);
  const sharedMemoryVaultEnabled =
    hasLivePermission(myPermissions, 'shared_memory_vault') &&
    hasLivePermission(partnerPermissions, 'shared_memory_vault');
  const sharedAiEnabled =
    hasLivePermission(myPermissions, 'ai_shared_recap_access') &&
    hasLivePermission(partnerPermissions, 'ai_shared_recap_access');
  const stageRequestCooldownLabel = getCooldownLabel(primaryRelationship?.stage_request_cooldown_until);

  const acceptRequest = async (relationshipId: string) => {
    try {
      const { error } = await supabase
        .from('relationships')
        .update({
          lifecycle_state: 'active',
          status: 'active',
          current_stage: 1,
          current_level: 1,
          requested_stage: null,
          stage_request_status: null,
          stage_request_from_user_id: null,
        })
        .eq('id', relationshipId);

      if (error) throw error;
      await createRelationshipEvent(relationshipId, 'request_accepted', {
        lifecycle_state: 'active',
        accepted_stage: 1,
      });
      await fetchData();
      return { success: true as const };
    } catch (error) {
      console.error('Error accepting request:', error);
      return { success: false as const, error: 'Failed to accept request.' };
    }
  };

  const rejectRequest = async (relationshipId: string) => {
    try {
      const { error } = await supabase
        .from('relationships')
        .update({
          lifecycle_state: 'archived',
          status: 'archived',
          archived_at: new Date().toISOString(),
          requested_stage: null,
          stage_request_status: null,
          stage_request_from_user_id: null,
        })
        .eq('id', relationshipId);

      if (error) throw error;
      await createRelationshipEvent(relationshipId, 'request_declined', {
        archived_at: new Date().toISOString(),
      });
      await fetchData();
      return { success: true as const };
    } catch (error) {
      console.error('Error declining request:', error);
      return { success: false as const, error: 'Failed to decline request.' };
    }
  };

  const sendHeart = async () => {
    if (!user?.id || !primaryRelationship) {
      return { success: false as const, error: 'No active HeartPath relationship found.' };
    }

    try {
      const isUserA = primaryRelationship.user_a === user.id;
      const heartColumn = isUserA ? 'hearts_a2b' : 'hearts_b2a';
      const currentHearts = isUserA ? primaryRelationship.hearts_a2b || 0 : primaryRelationship.hearts_b2a || 0;

      const { error } = await supabase
        .from('relationships')
        .update({
          [heartColumn]: currentHearts + 1,
          trust_score: Math.min((primaryRelationship.trust_score || 0) + 2, 100),
          updated_at: new Date().toISOString(),
        })
        .eq('id', primaryRelationship.id);

      if (error) throw error;
      await createRelationshipEvent(primaryRelationship.id, 'heart_sent', {
        trust_score: Math.min((primaryRelationship.trust_score || 0) + 2, 100),
      });
      await fetchData();
      return { success: true as const };
    } catch (error) {
      console.error('Error sending heart:', error);
      return { success: false as const, error: 'Failed to send a heart.' };
    }
  };

  const requestStageAdvance = async () => {
    if (!user?.id || !primaryRelationship) {
      return { success: false as const, error: 'No relationship available to advance.' };
    }

    if (primaryRelationship.lifecycle_state === 'paused') {
      return { success: false as const, error: 'Resume this relationship before requesting a new stage.' };
    }

    if (requestIsOpen) {
      return { success: false as const, error: 'There is already a pending stage request.' };
    }

    if (!nextStage) {
      return { success: false as const, error: 'You are already at the Exclusive stage.' };
    }

    if (
      primaryRelationship.stage_request_cooldown_until &&
      new Date(primaryRelationship.stage_request_cooldown_until) > new Date()
    ) {
      return { success: false as const, error: 'Wait until the stage-request cooldown ends before trying again.' };
    }

    try {
      const { error } = await supabase
        .from('relationships')
        .update({
          requested_stage: nextStage,
          stage_request_from_user_id: user.id,
          stage_request_status: 'pending',
          stage_request_cooldown_until: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', primaryRelationship.id);

      if (error) throw error;
      await createRelationshipEvent(primaryRelationship.id, 'stage_requested', {
        from_stage: currentStage,
        requested_stage: nextStage,
      });
      await fetchData();
      return { success: true as const, nextStage };
    } catch (error) {
      console.error('Error requesting stage advance:', error);
      return { success: false as const, error: 'Failed to send the next-stage request.' };
    }
  };

  const respondToStageRequest = async (decision: 'accept' | 'decline' | 'defer') => {
    if (!user?.id || !primaryRelationship || !requestIsOpen) {
      return { success: false as const, error: 'There is no pending stage request to respond to.' };
    }

    if (primaryRelationship.stage_request_from_user_id === user.id) {
      return { success: false as const, error: 'You cannot respond to your own stage request.' };
    }

    try {
      if (decision === 'accept') {
        const acceptedStage = primaryRelationship.requested_stage || currentStage;
        const { error } = await supabase
          .from('relationships')
          .update({
            current_stage: acceptedStage,
            current_level: acceptedStage,
            lifecycle_state: acceptedStage >= 6 ? 'exclusive' : 'active',
            status: acceptedStage >= 6 ? 'exclusive' : 'active',
            trust_score: Math.min((primaryRelationship.trust_score || 0) + 8, 100),
            requested_stage: null,
            stage_request_status: null,
            stage_request_from_user_id: null,
            stage_request_cooldown_until: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', primaryRelationship.id);

        if (error) throw error;
        await createRelationshipEvent(primaryRelationship.id, 'stage_accepted', {
          previous_stage: currentStage,
          accepted_stage: acceptedStage,
        });
      } else {
        const cooldownUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const { error } = await supabase
          .from('relationships')
          .update({
            requested_stage: null,
            stage_request_status: decision === 'decline' ? 'declined' : 'deferred',
            stage_request_from_user_id: null,
            stage_request_cooldown_until: cooldownUntil,
            updated_at: new Date().toISOString(),
          })
          .eq('id', primaryRelationship.id);

        if (error) throw error;
        await createRelationshipEvent(primaryRelationship.id, decision === 'decline' ? 'stage_declined' : 'stage_deferred', {
          current_stage: currentStage,
          cooldown_until: cooldownUntil,
        });
      }

      await fetchData();
      return { success: true as const };
    } catch (error) {
      console.error('Error responding to stage request:', error);
      return { success: false as const, error: 'Failed to update the stage request.' };
    }
  };

  const setPermissionState = async (permission: HeartPathPermissionName, enabled: boolean) => {
    if (!user?.id || !primaryRelationship || !partner?.id) {
      return { success: false as const, error: 'No relationship available to update permissions.' };
    }

    if (enabled && !canGrantPermissionAtStage(permission, currentStage)) {
      return { success: false as const, error: 'This permission unlocks at a later HeartPath stage.' };
    }

    try {
      const existing = permissions.find(
        (item) =>
          item.relationship_id === primaryRelationship.id &&
          item.permission === permission &&
          item.granted_by === user.id &&
          item.granted_to === partner.id
      );

      if (!existing && enabled) {
        const { error } = await supabase.from('relationship_permissions').insert({
          relationship_id: primaryRelationship.id,
          permission,
          granted_by: user.id,
          granted_to: partner.id,
        });

        if (error) throw error;
      } else if (existing) {
        const { error } = await supabase
          .from('relationship_permissions')
          .update({
            revoked_at: enabled ? null : new Date().toISOString(),
            granted_at: enabled ? new Date().toISOString() : existing.granted_at,
          })
          .eq('id', existing.id);

        if (error) throw error;
      }

      await fetchData();
      await createRelationshipEvent(primaryRelationship.id, enabled ? 'permission_granted' : 'permission_revoked', {
        permission,
        granted_to: partner.id,
      });
      return { success: true as const };
    } catch (error) {
      console.error('Error updating permission:', error);
      return { success: false as const, error: 'Failed to update that permission.' };
    }
  };

  const saveCheckin = async (input: {
    relationship_rating: number;
    relationship_note: string;
    gratitude_note: string;
    visibility: 'private' | 'shared';
  }) => {
    if (!user?.id || !primaryRelationship) {
      return { success: false as const, error: 'No relationship available for a check-in.' };
    }

    const parsed = weeklyCheckinSchema.safeParse({
      relationship_rating: input.relationship_rating,
      relationship_note: input.relationship_note,
      gratitude_note: input.gratitude_note,
    });
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message || 'Invalid weekly check-in.',
      };
    }

    try {
      const { error } = await supabase.from('weekly_checkins').upsert(
        {
          relationship_id: primaryRelationship.id,
          user_id: user.id,
          week_start: startOfCurrentWeek(),
          relationship_rating: input.relationship_rating,
          relationship_note: input.relationship_note,
          gratitude_note: input.gratitude_note,
          visibility: input.visibility,
        },
        { onConflict: 'relationship_id,user_id,week_start' }
      );

      if (error) throw error;
      await createRelationshipEvent(primaryRelationship.id, 'checkin_saved', {
        visibility: input.visibility,
        relationship_rating: input.relationship_rating,
      });
      await fetchData();
      return { success: true as const };
    } catch (error) {
      console.error('Error saving weekly check-in:', error);
      return { success: false as const, error: "Failed to save this week's check-in." };
    }
  };

  const saveMemory = async (input: {
    memo_text: string;
    entry_type: string;
    visibility: 'private' | 'shared';
    mood?: string;
    tags?: string[];
    reflection_follow_up?: string;
  }) => {
    if (!user?.id || !primaryRelationship) {
      return { success: false as const, error: 'No relationship selected for this memory.' };
    }

    if (input.visibility === 'shared' && !sharedMemoryVaultEnabled) {
      return { success: false as const, error: 'Both partners must enable the shared memory vault first.' };
    }

    const parsed = memorySchema.safeParse({
      memo_text: input.memo_text,
      entry_type: input.entry_type,
      visibility: input.visibility,
    });
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message || 'Invalid memory.',
      };
    }

    try {
      const { error } = await supabase.from('memories').insert({
        relationship_id: primaryRelationship.id,
        created_by: user.id,
        level_at: currentStage,
        memo_text: input.memo_text,
        entry_type: input.entry_type,
        visibility: input.visibility,
        mood: input.mood || null,
        tags: input.tags || [],
        reflection_follow_up: input.reflection_follow_up || null,
      });

      if (error) throw error;
      await createRelationshipEvent(primaryRelationship.id, 'memory_saved', {
        entry_type: input.entry_type,
        visibility: input.visibility,
      });
      await fetchData();
      return { success: true as const };
    } catch (error) {
      console.error('Error saving memory:', error);
      return { success: false as const, error: 'Failed to save this memory.' };
    }
  };

  const generateAiSummary = async (input: {
    kind: 'monthly_recap' | 'milestone_summary' | 'memory_search';
    query?: string;
    visibility: 'private' | 'shared';
  }) => {
    if (!user?.id || !primaryRelationship || !partner) {
      return { success: false as const, error: 'No relationship available for AI recap generation.' };
    }

    if (input.visibility === 'shared' && !sharedAiEnabled) {
      return { success: false as const, error: 'Both partners must grant AI shared recap access first.' };
    }

    try {
      const sharedMemories = memories.filter(
        (memory) => input.visibility === 'private' ? memory.created_by === user.id : memory.visibility === 'shared'
      );
      const visibleCheckins = checkins.filter(
        (checkin) => input.visibility === 'private' ? checkin.user_id === user.id : checkin.visibility === 'shared'
      );

      let generated;
      if (input.kind === 'monthly_recap') {
        generated = buildMonthlyRecap({
          currentStage,
          partnerName: partner.name,
          trustScore: primaryRelationship.trust_score || 0,
          heartsGiven: primaryRelationship.user_a === user.id ? primaryRelationship.hearts_a2b || 0 : primaryRelationship.hearts_b2a || 0,
          heartsReceived: primaryRelationship.user_a === user.id ? primaryRelationship.hearts_b2a || 0 : primaryRelationship.hearts_a2b || 0,
          memories: sharedMemories,
          checkins: visibleCheckins,
        });
      } else if (input.kind === 'milestone_summary') {
        generated = buildMilestoneSummary({
          currentStage,
          partnerName: partner.name,
          trustScore: primaryRelationship.trust_score || 0,
          heartsGiven: primaryRelationship.user_a === user.id ? primaryRelationship.hearts_a2b || 0 : primaryRelationship.hearts_b2a || 0,
          heartsReceived: primaryRelationship.user_a === user.id ? primaryRelationship.hearts_b2a || 0 : primaryRelationship.hearts_a2b || 0,
          memories: sharedMemories,
          checkins: visibleCheckins,
        });
      } else {
        generated = buildMemorySearchResult(input.query || '', sharedMemories);
      }

      const { error } = await supabase.from('ai_summaries').insert({
        relationship_id: primaryRelationship.id,
        generated_by: user.id,
        summary_kind: input.kind,
        source_scope: input.visibility,
        visibility: input.visibility,
        consent_scope: input.visibility === 'shared' ? 'mutual_ai_shared_recap_access' : 'private_owner_only',
        title: generated.title,
        summary: generated.summary,
        metadata: {
          query: input.query || null,
          relationship_stage: currentStage,
        },
      });

      if (error) throw error;
      await fetchData();
      return { success: true as const };
    } catch (error) {
      console.error('Error generating AI summary:', error);
      return { success: false as const, error: 'Failed to generate the AI recap.' };
    }
  };

  const updateRelationshipSettings = async (input: {
    pace_preference: 'gentle' | 'steady' | 'deepening';
    boundary_topics: string[];
    agreements_summary: string;
  }) => {
    if (!primaryRelationship) {
      return { success: false as const, error: 'No relationship available to update.' };
    }

    try {
      const { error } = await supabase
        .from('relationships')
        .update({
          pace_preference: input.pace_preference,
          boundary_topics: input.boundary_topics,
          agreements_summary: input.agreements_summary,
          updated_at: new Date().toISOString(),
        })
        .eq('id', primaryRelationship.id);

      if (error) throw error;
      await fetchData();
      return { success: true as const };
    } catch (error) {
      console.error('Error updating relationship settings:', error);
      return { success: false as const, error: 'Failed to save your boundaries and pace.' };
    }
  };

  const setPausedState = async (paused: boolean) => {
    if (!primaryRelationship) {
      return { success: false as const, error: 'No relationship available to update.' };
    }

    try {
      const fallbackState = currentStage >= 6 ? 'exclusive' : 'active';
      const { error } = await supabase
        .from('relationships')
        .update({
          lifecycle_state: paused ? 'paused' : fallbackState,
          status: paused ? 'paused' : fallbackState,
          paused_at: paused ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', primaryRelationship.id);

      if (error) throw error;
      await fetchData();
      return { success: true as const };
    } catch (error) {
      console.error('Error pausing relationship:', error);
      return { success: false as const, error: 'Failed to update the pause state.' };
    }
  };

  const archiveRelationship = async () => {
    if (!primaryRelationship) {
      return { success: false as const, error: 'No relationship available to archive.' };
    }

    try {
      const { error } = await supabase
        .from('relationships')
        .update({
          lifecycle_state: 'cooldown',
          status: 'cooldown',
          cooldown_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          archived_at: new Date().toISOString(),
          requested_stage: null,
          stage_request_status: null,
          stage_request_from_user_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', primaryRelationship.id);

      if (error) throw error;

      if (primaryRelationship.id) {
        await supabase
          .from('relationship_permissions')
          .update({ revoked_at: new Date().toISOString() })
          .eq('relationship_id', primaryRelationship.id)
          .in('permission', SHARED_PERMISSION_NAMES);
      }

      await createRelationshipEvent(primaryRelationship.id, 'archived', {
        lifecycle_state: 'cooldown',
        cooldown_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      await fetchData();
      return { success: true as const };
    } catch (error) {
      console.error('Error archiving relationship:', error);
      return { success: false as const, error: 'Failed to archive this relationship.' };
    }
  };

  const reportPartner = async (input: {
    reason: 'fake_identity' | 'pressure' | 'harassment' | 'boundary_violation' | 'unsafe_behavior' | 'other';
    details?: string;
  }) => {
    if (!user?.id || !partner?.id) {
      return { success: false as const, error: 'No partner available to report.' };
    }

    const parsed = reportSchema.safeParse({
      reason: input.reason,
      details: input.details?.trim() || undefined,
    });
    if (!parsed.success) {
      return {
        success: false as const,
        error: parsed.error.issues[0]?.message || 'Invalid report.',
      };
    }

    try {
      const { error } = await supabase.from('reports').insert({
        reporter_user_id: user.id,
        target_user_id: partner.id,
        relationship_id: primaryRelationship?.id || null,
        reason: input.reason,
        details: input.details?.trim() || null,
      });

      if (error) throw error;
      await fetchData();
      return { success: true as const };
    } catch (error) {
      console.error('Error reporting partner:', error);
      return { success: false as const, error: 'Failed to submit the report.' };
    }
  };

  const blockPartner = async () => {
    if (!user?.id || !partner?.id) {
      return { success: false as const, error: 'No partner available to block.' };
    }

    try {
      const { data: existingBlock, error: existingBlockError } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', partner.id)
        .maybeSingle();

      if (existingBlockError) throw existingBlockError;

      if (!existingBlock) {
        const { error: blockError } = await supabase.from('blocked_users').insert({
          blocker_id: user.id,
          blocked_id: partner.id,
        });

        if (blockError) throw blockError;
      }

      if (primaryRelationship) {
        const { error: relationshipError } = await supabase
          .from('relationships')
          .update({
            lifecycle_state: 'archived',
            status: 'archived',
            archived_at: new Date().toISOString(),
            requested_stage: null,
            stage_request_status: null,
            stage_request_from_user_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', primaryRelationship.id);

        if (relationshipError) throw relationshipError;

        await createRelationshipEvent(primaryRelationship.id, 'archived', {
          source: 'block_action',
        });
      }

      await fetchData();
      return { success: true as const };
    } catch (error) {
      console.error('Error blocking partner:', error);
      return { success: false as const, error: 'Failed to block this user.' };
    }
  };

  return {
    loading,
    relationships,
    incomingRequests,
    outgoingRequests,
    primaryRelationship,
    partner,
    permissions,
    memories,
    checkins,
    aiSummaries,
    events,
    reports,
    currentStage,
    nextStage,
    requestIsOpen,
    isExclusive,
    isPaused,
    discoveryLocked,
    stageRequestCooldownLabel,
    activeRelationshipCount: relationships.filter((relationship) =>
      ACTIVE_STATES.includes((relationship.lifecycle_state || 'pending') as (typeof ACTIVE_STATES)[number])
    ).length,
    blockingRelationshipIds: relationships
      .filter((relationship) =>
        DISCOVERY_BLOCKING_STATES.includes(
          (relationship.lifecycle_state || 'pending') as (typeof DISCOVERY_BLOCKING_STATES)[number]
        )
      )
      .map((relationship) => relationship.id),
    myPermissions,
    partnerPermissions,
    sharedMemoryVaultEnabled,
    sharedAiEnabled,
    permissionCatalog: HEARTPATH_PERMISSION_CATALOG,
    fetchData,
    acceptRequest,
    rejectRequest,
    sendHeart,
    requestStageAdvance,
    respondToStageRequest,
    setPermissionState,
    saveCheckin,
    saveMemory,
    generateAiSummary,
    updateRelationshipSettings,
    setPausedState,
    archiveRelationship,
    reportPartner,
    blockPartner,
  };
};
