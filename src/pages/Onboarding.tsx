import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Heart, Loader2, MailCheck, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import UploadInput from '@/components/UploadInput';
import VerificationStatusCard from '@/components/VerificationStatusCard';
import OnboardingProgressCard from '@/components/OnboardingProgressCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  canAccessProtectedArea,
  clampProfileCompleteness,
  getStepIndex,
  normalizeAccessState,
  normalizeOnboardingStep,
  normalizeVerificationBadges,
  ONBOARDING_STEPS,
  ONBOARDING_STEP_LABELS,
  type OnboardingStep,
} from '@/lib/access-state';
import { getAllowedOnboardingSteps, getNextOnboardingStep } from '@/lib/onboarding';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';

type UserRow = Tables<'users'>;

const hobbyOptions = [
  'Reading',
  'Gaming',
  'Music',
  'Sports',
  'Art',
  'Cooking',
  'Travel',
  'Photography',
  'Dancing',
  'Writing',
  'Movies',
  'Fitness',
  'Technology',
];

const boundaryOptions = [
  'Slow emotional pacing',
  'No public posting',
  'No late-night calls',
  'No voice notes yet',
  'No pressure around exclusivity',
  'Friendship first',
];

const valueOptions = ['Loyalty', 'Patience', 'Ambition', 'Faith', 'Humor', 'Growth', 'Kindness', 'Consistency'] as const;
const lifestyleOptions = ['Quiet weekends', 'Fitness', 'Study focus', 'Travel', 'Clubs & events', 'Family oriented', 'Creative hobbies', 'Career driven'] as const;
const chatFrequencyOptions = ['Occasional', 'Steady', 'Daily'] as const;
const relationshipIntentOptions = ['Friendship first', 'Slow-burn dating', 'Serious relationship'] as const;
const comfortOptions = ['Not yet', 'Maybe later', 'Comfortable now'] as const;
const communicationStyleOptions = ['thoughtful', 'balanced', 'expressive'] as const;
const paceStyleOptions = ['gentle', 'steady', 'deepening'] as const;

const defaultFormState = {
  name: '',
  college_name: '',
  branch: '',
  year: '',
  pronouns: '',
  languages: [] as string[],
  campus_zone: '',
  about: '',
  hobbies: [] as string[],
  relationship_intent: '',
  preferred_chat_frequency: '',
  communication_style: '',
  value_tags: [] as string[],
  lifestyle_preferences: [] as string[],
  voice_notes_comfort: '',
  privacy_comfort: '',
  pace_style: '',
  boundary_topics: [] as string[],
  deal_breakers: [] as string[],
  heartpath_norms_acknowledged: false,
  photo: null as File | null,
};

const Onboarding = () => {
  const [formData, setFormData] = useState(defaultFormState);
  const [photoPreview, setPhotoPreview] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [domainCollegeName, setDomainCollegeName] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<OnboardingStep>('verify');
  const [profile, setProfile] = useState<UserRow | null>(null);
  const [customLanguage, setCustomLanguage] = useState('');
  const [customBoundary, setCustomBoundary] = useState('');
  const [customDealBreaker, setCustomDealBreaker] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [customLifestyle, setCustomLifestyle] = useState('');
  const { user, refreshUser, resendVerificationEmail, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const verificationBadges = useMemo(
    () => normalizeVerificationBadges(profile?.verification_badges ?? user?.verificationBadges ?? null),
    [profile?.verification_badges, user?.verificationBadges]
  );
  const accessState = normalizeAccessState(profile?.access_state ?? user?.accessState ?? 'verification_pending');
  const profileCompleteness = clampProfileCompleteness(profile?.profile_completeness ?? user?.profileCompleteness ?? 0);
  const serverStep = normalizeOnboardingStep(profile?.onboarding_step ?? user?.onboardingStep ?? 'verify');
  const allowedSteps = useMemo(() => getAllowedOnboardingSteps(profile), [profile]);

  useEffect(() => {
    if (!user?.id) return;

    void loadProfile();
  }, [user?.id]);

  useEffect(() => {
    if (profile) {
      setActiveStep(serverStep);
    }
  }, [serverStep, profile]);

  useEffect(() => {
    if (user && canAccessProtectedArea(user.accessState)) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, user]);

  const loadProfile = async () => {
    if (!user?.id) return;

    try {
      setIsLoadingProfile(true);

      const [{ data: profileRow, error: profileError }, { data: domainRows, error: domainError }] = await Promise.all([
        supabase.rpc('sync_user_access_state'),
        supabase.rpc('check_college_email_domain', { email: user.email }),
      ]);

      if (profileError) throw profileError;
      if (domainError) throw domainError;

      setProfile(profileRow);
      setDomainCollegeName(domainRows?.[0]?.college_name ?? null);
      setFormData({
        name: profileRow?.name || '',
        college_name: profileRow?.college_name || domainRows?.[0]?.college_name || '',
        branch: profileRow?.branch || '',
        year: profileRow?.year?.toString() || '',
        pronouns: profileRow?.pronouns || '',
        languages: profileRow?.languages || [],
        campus_zone: profileRow?.campus_zone || '',
        about: profileRow?.about || '',
        hobbies: profileRow?.hobbies || [],
        relationship_intent: profileRow?.relationship_intent || '',
        preferred_chat_frequency: profileRow?.preferred_chat_frequency || '',
        communication_style: profileRow?.communication_style || '',
        value_tags: profileRow?.value_tags || [],
        lifestyle_preferences: profileRow?.lifestyle_preferences || [],
        voice_notes_comfort: profileRow?.voice_notes_comfort || '',
        privacy_comfort: profileRow?.privacy_comfort || '',
        pace_style: profileRow?.pace_style || '',
        boundary_topics: profileRow?.boundary_topics || [],
        deal_breakers: profileRow?.deal_breakers || [],
        heartpath_norms_acknowledged: Boolean(profileRow?.heartpath_norms_acknowledged_at),
        photo: null,
      });

      const profilePhotoLevels =
        profileRow?.photo_levels && typeof profileRow.photo_levels === 'object' && !Array.isArray(profileRow.photo_levels)
          ? (profileRow.photo_levels as Record<string, unknown>)
          : null;
      const levelOnePhoto = typeof profilePhotoLevels?.level_1 === 'string' ? profilePhotoLevels.level_1 : undefined;
      setPhotoPreview(levelOnePhoto || '');

      await refreshUser();
    } catch (error) {
      console.error('Failed to load onboarding profile:', error);
      toast({
        title: 'Unable to load verification state',
        description: 'Please retry. HeartPath could not sync your account state just now.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | string[] | boolean | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleChipValue = (field: 'hobbies' | 'boundary_topics' | 'value_tags' | 'lifestyle_preferences' | 'deal_breakers', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const handlePhotoSelect = (file: File) => {
    setFormData((prev) => ({ ...prev, photo: file }));
    setUploadStatus('idle');

    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview((event.target?.result as string) || '');
    };
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async (file: File) => {
    if (!user?.id) {
      throw new Error('You must be signed in to upload a photo.');
    }

    setUploadStatus('uploading');
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}/level_1.${extension}`;

    const { error: uploadError } = await supabase.storage.from('profile-photos').upload(fileName, file, { upsert: true });
    if (uploadError) {
      setUploadStatus('error');
      throw uploadError;
    }

    const { data } = supabase.storage.from('profile-photos').getPublicUrl(fileName);
    setUploadStatus('success');
    return data.publicUrl;
  };

  const saveStep = async (step: OnboardingStep) => {
    if (!user?.id) return;

    const updates: TablesUpdate<'users'> = {};

    if (step === 'basics') {
      if (!formData.name.trim() || !formData.college_name.trim() || !formData.branch.trim() || !formData.year) {
        throw new Error('Complete all required basics before continuing.');
      }

      updates.name = formData.name.trim();
      updates.college_name = formData.college_name.trim();
      updates.branch = formData.branch.trim();
      updates.year = Number(formData.year);
      updates.pronouns = formData.pronouns.trim() || null;
      updates.languages = formData.languages.length ? formData.languages : [];
      updates.campus_zone = formData.campus_zone.trim() || null;
    }

    if (step === 'heartpath') {
      if (
        !formData.about.trim() ||
        !formData.hobbies.length ||
        !formData.relationship_intent ||
        !formData.preferred_chat_frequency ||
        !formData.communication_style ||
        !formData.value_tags.length ||
        !formData.lifestyle_preferences.length ||
        !formData.heartpath_norms_acknowledged
      ) {
        throw new Error('Complete your HeartPath preferences before continuing.');
      }

      updates.about = formData.about.trim();
      updates.hobbies = formData.hobbies;
      updates.relationship_intent = formData.relationship_intent;
      updates.preferred_chat_frequency = formData.preferred_chat_frequency;
      updates.communication_style = formData.communication_style;
      updates.value_tags = formData.value_tags;
      updates.lifestyle_preferences = formData.lifestyle_preferences;
      updates.heartpath_norms_acknowledged_at = new Date().toISOString();
    }

    if (step === 'boundaries') {
      if (!formData.voice_notes_comfort || !formData.privacy_comfort || !formData.pace_style) {
        throw new Error('Choose your comfort settings before continuing.');
      }

      updates.voice_notes_comfort = formData.voice_notes_comfort;
      updates.privacy_comfort = formData.privacy_comfort;
      updates.pace_style = formData.pace_style;
      updates.boundary_topics = formData.boundary_topics;
      updates.deal_breakers = formData.deal_breakers;
    }

    if (step === 'photo_review') {
      const existingLevels =
        profile?.photo_levels && typeof profile.photo_levels === 'object' && !Array.isArray(profile.photo_levels)
          ? (profile.photo_levels as Record<string, unknown>)
          : {};
      let levelOnePhoto = typeof existingLevels.level_1 === 'string' ? existingLevels.level_1 : '';

      if (formData.photo) {
        levelOnePhoto = await uploadPhoto(formData.photo);
      }

      if (!levelOnePhoto) {
        throw new Error('Add your level-1 photo before activating HeartPath.');
      }

      updates.photo_levels = {
        ...existingLevels,
        level_1: levelOnePhoto,
      };
      updates.onboarding_completed_at = new Date().toISOString();
      updates.onboarding_step = 'complete';
      updates.access_state = 'active';
    } else {
      updates.onboarding_step = getNextOnboardingStep(step);
    }

    const { error } = await supabase.from('users').update(updates).eq('id', user.id);
    if (error) throw error;

    await loadProfile();
  };

  const handleContinue = async () => {
    if (activeStep === 'verify') {
      if (accessState === 'blocked') return;
      if (!verificationBadges.email_verified || !verificationBadges.student_verified) {
        toast({
          title: 'Verification still pending',
          description: 'Confirm your college email first to unlock the next onboarding step.',
          variant: 'destructive',
        });
        return;
      }

      setActiveStep('basics');
      return;
    }

    try {
      setIsSubmitting(true);
      await saveStep(activeStep);
      if (activeStep === 'photo_review') {
        await refreshUser();
        navigate('/dashboard');
        return;
      }

      const nextStep = getNextOnboardingStep(activeStep);
      setActiveStep(nextStep);
      toast({
        title: 'Progress saved',
        description: `${ONBOARDING_STEP_LABELS[activeStep]} saved successfully.`,
      });
    } catch (error: any) {
      toast({
        title: 'Could not save this step',
        description: error.message || 'Please review your details and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    const currentIndex = getStepIndex(activeStep);
    const previousStep = ONBOARDING_STEPS[Math.max(currentIndex - 1, 0)];
    setActiveStep(previousStep);
  };

  const addCustomLanguage = () => {
    const value = customLanguage.trim();
    if (!value || formData.languages.includes(value)) return;
    handleInputChange('languages', [...formData.languages, value]);
    setCustomLanguage('');
  };

  const addCustomBoundary = () => {
    const value = customBoundary.trim();
    if (!value || formData.boundary_topics.includes(value)) return;
    handleInputChange('boundary_topics', [...formData.boundary_topics, value]);
    setCustomBoundary('');
  };

  const addCustomDealBreaker = () => {
    const value = customDealBreaker.trim();
    if (!value || formData.deal_breakers.includes(value)) return;
    handleInputChange('deal_breakers', [...formData.deal_breakers, value]);
    setCustomDealBreaker('');
  };

  const addCustomValue = () => {
    const value = customValue.trim();
    if (!value || formData.value_tags.includes(value)) return;
    handleInputChange('value_tags', [...formData.value_tags, value]);
    setCustomValue('');
  };

  const addCustomLifestyle = () => {
    const value = customLifestyle.trim();
    if (!value || formData.lifestyle_preferences.includes(value)) return;
    handleInputChange('lifestyle_preferences', [...formData.lifestyle_preferences, value]);
    setCustomLifestyle('');
  };

  const renderVerifyStep = () => {
    const isBlocked = accessState === 'blocked';

    return (
      <div className="space-y-6">
        <VerificationStatusCard
          profileCompleteness={profileCompleteness}
          verificationBadges={verificationBadges}
          title="Verified student access"
          description="HeartPath unlocks only after your approved college email has been confirmed."
        />

        <Card className="border-romantic-pink/30 dark:bg-romantic-dark-card">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-start gap-3">
              {isBlocked ? (
                <ShieldAlert className="mt-0.5 h-5 w-5 text-red-500" />
              ) : (
                <MailCheck className="mt-0.5 h-5 w-5 text-romantic-red" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{user?.email}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {domainCollegeName ? `Approved domain for ${domainCollegeName}` : 'Checking college domain access'}
                </p>
              </div>
            </div>

            {!verificationBadges.email_verified && !isBlocked ? (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
                Confirm your email from your college inbox to continue.
              </div>
            ) : null}

            {isBlocked ? (
              <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-700 dark:bg-red-950/30 dark:text-red-200">
                This email domain is not currently approved for HeartPath. Use an approved college email to continue.
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              {!verificationBadges.email_verified && !isBlocked ? (
                <Button
                  type="button"
                  className="romantic-btn"
                  onClick={() => void resendVerificationEmail(user?.email || '')}
                >
                  Resend verification email
                </Button>
              ) : null}
              <Button type="button" variant="outline" onClick={() => void loadProfile()}>
                Retry verification
              </Button>
              {isBlocked ? (
                <Button type="button" variant="outline" onClick={() => void logout()}>
                  Sign out
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderBasicsStep = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name *</Label>
        <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="college_name">College Name *</Label>
        <Input
          id="college_name"
          value={formData.college_name}
          onChange={(e) => handleInputChange('college_name', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="branch">Branch / Major *</Label>
        <Input id="branch" value={formData.branch} onChange={(e) => handleInputChange('branch', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="year">Academic Year *</Label>
        <Select value={formData.year} onValueChange={(value) => handleInputChange('year', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1st Year</SelectItem>
            <SelectItem value="2">2nd Year</SelectItem>
            <SelectItem value="3">3rd Year</SelectItem>
            <SelectItem value="4">4th Year</SelectItem>
            <SelectItem value="5">Graduate</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pronouns">Pronouns</Label>
        <Input id="pronouns" value={formData.pronouns} onChange={(e) => handleInputChange('pronouns', e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="campus_zone">Campus Zone</Label>
        <Input
          id="campus_zone"
          value={formData.campus_zone}
          onChange={(e) => handleInputChange('campus_zone', e.target.value)}
          placeholder="Hostel block, central campus, library side..."
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Languages</Label>
        <div className="mb-3 flex flex-wrap gap-2">
          {formData.languages.map((language) => (
            <button
              key={language}
              type="button"
              onClick={() => handleInputChange('languages', formData.languages.filter((item) => item !== language))}
              className="rounded-full bg-romantic-light-pink px-3 py-1 text-sm text-romantic-red"
            >
              {language} ×
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={customLanguage}
            onChange={(e) => setCustomLanguage(e.target.value)}
            placeholder="Add a language"
          />
          <Button type="button" variant="outline" onClick={addCustomLanguage}>
            Add
          </Button>
        </div>
      </div>
    </div>
  );

  const renderHeartPathStep = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="about">About You *</Label>
        <Textarea
          id="about"
          value={formData.about}
          onChange={(e) => handleInputChange('about', e.target.value)}
          placeholder="Tell HeartPath how you show up in a healthy relationship."
          className="min-h-[120px]"
        />
      </div>
      <div className="space-y-2">
        <Label>Hobbies & Interests *</Label>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {hobbyOptions.map((hobby) => {
            const selected = formData.hobbies.includes(hobby);
            return (
              <button
                key={hobby}
                type="button"
                onClick={() => toggleChipValue('hobbies', hobby)}
                className={`rounded-xl border px-4 py-3 text-sm transition ${
                  selected
                    ? 'border-romantic-red bg-romantic-light-pink text-romantic-red'
                    : 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-romantic-dark-card dark:text-gray-300'
                }`}
              >
                {hobby}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Relationship Intent *</Label>
          <Select value={formData.relationship_intent} onValueChange={(value) => handleInputChange('relationship_intent', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose your intent" />
            </SelectTrigger>
            <SelectContent>
              {relationshipIntentOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Preferred Chat Frequency *</Label>
          <Select value={formData.preferred_chat_frequency} onValueChange={(value) => handleInputChange('preferred_chat_frequency', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a rhythm" />
            </SelectTrigger>
            <SelectContent>
              {chatFrequencyOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Communication Style *</Label>
        <Select value={formData.communication_style} onValueChange={(value) => handleInputChange('communication_style', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Choose your communication style" />
          </SelectTrigger>
          <SelectContent>
            {communicationStyleOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Core Values *</Label>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {valueOptions.map((valueTag) => {
            const selected = formData.value_tags.includes(valueTag);
            return (
              <button
                key={valueTag}
                type="button"
                onClick={() => toggleChipValue('value_tags', valueTag)}
                className={`rounded-xl border px-4 py-3 text-sm transition ${
                  selected
                    ? 'border-romantic-red bg-romantic-light-pink text-romantic-red'
                    : 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-romantic-dark-card dark:text-gray-300'
                }`}
              >
                {valueTag}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 pt-2">
          <Input value={customValue} onChange={(e) => setCustomValue(e.target.value)} placeholder="Add a core value" />
          <Button type="button" variant="outline" onClick={addCustomValue}>
            Add
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Lifestyle Preferences *</Label>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {lifestyleOptions.map((item) => {
            const selected = formData.lifestyle_preferences.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggleChipValue('lifestyle_preferences', item)}
                className={`rounded-xl border px-4 py-3 text-sm transition ${
                  selected
                    ? 'border-romantic-red bg-romantic-light-pink text-romantic-red'
                    : 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-romantic-dark-card dark:text-gray-300'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 pt-2">
          <Input value={customLifestyle} onChange={(e) => setCustomLifestyle(e.target.value)} placeholder="Add a lifestyle preference" />
          <Button type="button" variant="outline" onClick={addCustomLifestyle}>
            Add
          </Button>
        </div>
      </div>
      <div className="rounded-2xl border border-romantic-pink/30 bg-romantic-light-pink/40 p-4 dark:border-romantic-red/20 dark:bg-romantic-red/10">
        <div className="mb-3">
          <p className="font-medium text-gray-900 dark:text-white">HeartPath norms</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            HeartPath is for trust-first, real relationship building. No fake identity, no intimacy pressure, no hookup-first behavior.
          </p>
        </div>
        <label className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
          <Checkbox
            checked={formData.heartpath_norms_acknowledged}
            onCheckedChange={(checked) => handleInputChange('heartpath_norms_acknowledged', Boolean(checked))}
          />
          <span>I agree to use HeartPath respectfully and build connection through mutual trust and pace.</span>
        </label>
      </div>
    </div>
  );

  const renderBoundariesStep = () => (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Voice Notes Comfort *</Label>
          <Select value={formData.voice_notes_comfort} onValueChange={(value) => handleInputChange('voice_notes_comfort', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose comfort level" />
            </SelectTrigger>
            <SelectContent>
              {comfortOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Pace Style *</Label>
          <Select value={formData.pace_style} onValueChange={(value) => handleInputChange('pace_style', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a pace" />
            </SelectTrigger>
            <SelectContent>
              {paceStyleOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Privacy Comfort *</Label>
          <Select value={formData.privacy_comfort} onValueChange={(value) => handleInputChange('privacy_comfort', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose comfort level" />
            </SelectTrigger>
            <SelectContent>
              {comfortOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Boundary Topics</Label>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {boundaryOptions.map((topic) => {
            const selected = formData.boundary_topics.includes(topic);
            return (
              <button
                key={topic}
                type="button"
                onClick={() => toggleChipValue('boundary_topics', topic)}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                  selected
                    ? 'border-romantic-red bg-romantic-light-pink text-romantic-red'
                    : 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-romantic-dark-card dark:text-gray-300'
                }`}
              >
                {topic}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 pt-2">
          <Input
            value={customBoundary}
            onChange={(e) => setCustomBoundary(e.target.value)}
            placeholder="Add a custom boundary"
          />
          <Button type="button" variant="outline" onClick={addCustomBoundary}>
            Add
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Deal-breakers</Label>
        <div className="flex flex-wrap gap-2">
          {formData.deal_breakers.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleInputChange('deal_breakers', formData.deal_breakers.filter((value) => value !== item))}
              className="rounded-full bg-romantic-light-pink px-3 py-1 text-sm text-romantic-red"
            >
              {item} ×
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={customDealBreaker}
            onChange={(e) => setCustomDealBreaker(e.target.value)}
            placeholder="Add a deal-breaker"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addCustomDealBreaker();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addCustomDealBreaker}>
            Add
          </Button>
        </div>
      </div>
    </div>
  );

  const renderPhotoReviewStep = () => (
    <div className="space-y-6">
      <UploadInput onFileSelect={handlePhotoSelect} preview={photoPreview} />
      <VerificationStatusCard
        profileCompleteness={profileCompleteness}
        verificationBadges={verificationBadges}
        title="Ready to activate"
        description="One level-one photo completes your verified HeartPath profile."
      />
      <Card className="border-romantic-pink/30 dark:bg-romantic-dark-card">
        <CardHeader>
          <CardTitle className="text-lg">Profile summary</CardTitle>
          <CardDescription>This is what HeartPath will activate when you finish onboarding.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</p>
            <p className="text-sm text-gray-900 dark:text-white">{formData.name || 'Not set'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">College</p>
            <p className="text-sm text-gray-900 dark:text-white">{formData.college_name || 'Not set'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Intent</p>
            <p className="text-sm text-gray-900 dark:text-white">{formData.relationship_intent || 'Not set'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Chat rhythm</p>
            <p className="text-sm text-gray-900 dark:text-white">{formData.preferred_chat_frequency || 'Not set'}</p>
          </div>
        </CardContent>
      </Card>
      {uploadStatus !== 'idle' ? (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          {uploadStatus === 'uploading' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {uploadStatus === 'success' ? <CheckCircle className="h-4 w-4 text-green-500" /> : null}
          {uploadStatus === 'error' ? <AlertCircle className="h-4 w-4 text-red-500" /> : null}
          <span>
            {uploadStatus === 'uploading'
              ? 'Uploading your level-one photo...'
              : uploadStatus === 'success'
                ? 'Photo uploaded successfully.'
                : 'Photo upload failed.'}
          </span>
        </div>
      ) : null}
    </div>
  );

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-romantic-light-pink to-white p-4 dark:from-romantic-dark-bg dark:to-gray-900">
        <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-romantic-red" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Syncing your HeartPath access state...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-romantic-light-pink to-white p-4 dark:from-romantic-dark-bg dark:to-gray-900">
      <div className="mx-auto max-w-4xl space-y-6">
        <OnboardingProgressCard currentStep={activeStep} profileCompleteness={profileCompleteness} />

        <Card className="romantic-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-romantic-red to-romantic-pink">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-transparent bg-gradient-to-r from-romantic-red to-romantic-pink bg-clip-text">
              Complete Your HeartPath
            </CardTitle>
            <CardDescription>
              Verified student access comes first. Then we guide you through the profile, trust, and privacy basics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2 md:grid-cols-5">
              {ONBOARDING_STEPS.filter((step) => step !== 'complete').map((step) => {
                const isCurrent = activeStep === step;
                const isAvailable = allowedSteps.includes(step);
                return (
                  <button
                    key={step}
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => isAvailable && setActiveStep(step)}
                    className={`rounded-xl border px-3 py-3 text-left text-sm transition ${
                      isCurrent
                        ? 'border-romantic-red bg-romantic-light-pink text-romantic-red'
                        : isAvailable
                          ? 'border-gray-200 bg-white text-gray-700 hover:border-romantic-pink dark:border-gray-700 dark:bg-romantic-dark-card dark:text-gray-200'
                          : 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-800 dark:bg-gray-900/40'
                    }`}
                  >
                    {ONBOARDING_STEP_LABELS[step]}
                  </button>
                );
              })}
            </div>

            {activeStep === 'verify' ? renderVerifyStep() : null}
            {activeStep === 'basics' ? renderBasicsStep() : null}
            {activeStep === 'heartpath' ? renderHeartPathStep() : null}
            {activeStep === 'boundaries' ? renderBoundariesStep() : null}
            {activeStep === 'photo_review' ? renderPhotoReviewStep() : null}

            <div className="flex flex-col-reverse gap-3 border-t border-romantic-pink/20 pt-6 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                disabled={activeStep === 'verify' || isSubmitting}
                onClick={handleBack}
              >
                Back
              </Button>
              <Button
                type="button"
                className="romantic-btn"
                onClick={() => void handleContinue()}
                disabled={
                  isSubmitting ||
                  (accessState === 'blocked' && activeStep === 'verify') ||
                  (activeStep !== 'verify' && !allowedSteps.includes(activeStep))
                }
              >
                {isSubmitting ? 'Saving...' : activeStep === 'photo_review' ? 'Activate HeartPath' : 'Continue'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
