import { useState, useEffect, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Loader2, Sun, Moon, Monitor, Camera,
  User, SlidersHorizontal, ShieldCheck,
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { api } from '@/services/api'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'
import { useMe } from '@/hooks/useAuth'
import { useDateFormat } from '@/hooks/useDateFormat'
import { cn } from '@/lib/utils'

// ── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'NGN', name: 'Nigerian Naira' },
  { code: 'KES', name: 'Kenyan Shilling' },
  { code: 'TZS', name: 'Tanzanian Shilling' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'DKK', name: 'Danish Krone' },
]

const TIMEZONES = [
  'UTC',
  'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
  'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Mexico_City', 'America/New_York', 'America/Sao_Paulo',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Shanghai', 'Asia/Tokyo',
  'Australia/Sydney',
  'Europe/Berlin', 'Europe/Ljubljana', 'Europe/London', 'Europe/Paris',
  'Pacific/Auckland',
]

const NAV_SECTIONS = [
  {
    id: 'profile' as const,
    icon: User,
    label: 'Profile',
    description: 'Personal info & avatar',
  },
  {
    id: 'preferences' as const,
    icon: SlidersHorizontal,
    label: 'Preferences',
    description: 'Currency, timezone & theme',
  },
  {
    id: 'security' as const,
    icon: ShieldCheck,
    label: 'Security',
    description: 'Password & account',
  },
]

type SectionId = (typeof NAV_SECTIONS)[number]['id']

// ── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().optional(),
})

const prefsSchema = z.object({
  currency: z.string().min(1),
  timezone: z.string().min(1),
  theme: z.enum(['light', 'dark', 'system']),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(8, 'Minimum 8 characters'),
    confirmPassword: z.string().min(1, 'Required'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type ProfileData = z.infer<typeof profileSchema>
type PrefsData = z.infer<typeof prefsSchema>
type PasswordData = z.infer<typeof passwordSchema>

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</Label>
        {hint && <span className="text-xs text-zinc-400 dark:text-zinc-500">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ── Section card ──────────────────────────────────────────────────────────────



// ── Main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [active, setActive] = useState<SectionId>('profile')
  const qc = useQueryClient()
  const { user, setAuth } = useAuthStore()
  const { data: me } = useMe()
  const { fmtDate } = useDateFormat()
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: '', phone: '' },
  })

  const prefsForm = useForm<PrefsData>({
    resolver: zodResolver(prefsSchema),
    defaultValues: { currency: 'USD', timezone: 'UTC', theme: 'light' },
  })

  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (!me?.profile) return
    profileForm.reset({
      fullName: me.profile.fullName ?? '',
      phone: me.profile.phone ?? '',
    })
    prefsForm.reset({
      currency: me.profile.currency ?? 'USD',
      timezone: me.profile.timezone ?? 'UTC',
      theme: (me.profile.theme as 'light' | 'dark' | 'system') ?? 'light',
    })
  }, [me])

  const refreshStore = async () => {
    const freshUser = await authService.getMe()
    setAuth(freshUser)
    qc.invalidateQueries({ queryKey: ['me'] })
  }

  const profileMutation = useMutation({
    mutationFn: (data: ProfileData) => api.patch('/users/profile', data).then((r) => r.data),
    onSuccess: async () => { await refreshStore(); toast.success('Profile saved') },
    onError: () => toast.error('Failed to save profile'),
  })

  const prefsMutation = useMutation({
    mutationFn: (data: PrefsData) => api.patch('/users/profile', data).then((r) => r.data),
    onSuccess: async () => { await refreshStore(); toast.success('Preferences saved') },
    onError: () => toast.error('Failed to save preferences'),
  })

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordData) =>
      authService.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => { passwordForm.reset(); toast.success('Password changed') },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to change password'),
  })

  const avatarMutation = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('avatar', file)
      return api.post('/users/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
    },
    onSuccess: async () => { await refreshStore(); toast.success('Avatar updated') },
    onError: () => toast.error('Failed to upload avatar'),
  })

  const initials = me?.profile?.fullName
    ? me.profile.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="p-6 h-full">
      <div className="flex h-full bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm">

      {/* ── Left nav ─────────────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 border-r border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex flex-col">
        <div className="px-6 py-6 border-b border-zinc-100 dark:border-zinc-700">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Settings</h1>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">Manage your account and preferences</p>
        </div>

        <nav className="p-3 space-y-0.5 flex-1">
          {NAV_SECTIONS.map(({ id, icon: Icon, label, description }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors group',
                active === id
                  ? 'bg-primary/5 text-primary'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100',
              )}
            >
              <div
                className={cn(
                  'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                  active === id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-600',
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className={cn('text-sm font-medium leading-none', active === id ? 'text-primary' : 'text-zinc-800 dark:text-zinc-200')}>
                  {label}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">{description}</p>
              </div>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Right content ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl pl-2 pr-8 py-6 space-y-5">

          {/* ── Profile ── */}
          {active === 'profile' && (
            <div className="space-y-8">
              {/* Avatar */}
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">Your photo</p>
                  <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">Displayed on your profile and in the navigation bar</p>
                </div>
                <div className="flex items-center gap-5">
                  <div
                    className="relative group/av shrink-0 cursor-pointer"
                    onClick={() => !avatarMutation.isPending && avatarInputRef.current?.click()}
                  >
                    {me?.profile?.avatarUrl ? (
                      <img
                        src={me.profile.avatarUrl}
                        alt="Avatar"
                        className="h-20 w-20 rounded-2xl object-cover ring-2 ring-zinc-200"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-2xl bg-primary/10 ring-2 ring-primary/20 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary">{initials}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover/av:opacity-100 transition-opacity">
                      {avatarMutation.isPending
                        ? <Loader2 className="h-5 w-5 text-white animate-spin" />
                        : <Camera className="h-5 w-5 text-white" />
                      }
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {me?.profile?.fullName ?? user?.email}
                    </p>
                    <p className="text-sm text-zinc-400 dark:text-zinc-500 truncate mt-0.5">{user?.email}</p>
                    {user?.createdAt && (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                        Member since {fmtDate(user.createdAt, { month: 'long' })}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 h-8 text-xs"
                      disabled={avatarMutation.isPending}
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      {avatarMutation.isPending
                        ? <><Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> Uploading…</>
                        : <><Camera className="mr-1.5 h-3 w-3" /> Change photo</>
                      }
                    </Button>
                  </div>
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) avatarMutation.mutate(file)
                    e.target.value = ''
                  }}
                />
              </div>

              <Separator />

              {/* Personal info */}
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">Personal information</p>
                  <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">Update your name and contact details</p>
                </div>
                <form
                  onSubmit={profileForm.handleSubmit((d) => profileMutation.mutate(d))}
                  className="space-y-4"
                >
                  <Field label="Email address">
                    <Input
                      value={user?.email ?? ''}
                      disabled
                      className="bg-zinc-50 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Full name" error={profileForm.formState.errors.fullName?.message}>
                      <Input id="fullName" {...profileForm.register('fullName')} placeholder="John Doe" />
                    </Field>
                    <Field label="Phone" hint="(optional)">
                      <Input id="phone" {...profileForm.register('phone')} placeholder="+1 234 567 890" />
                    </Field>
                  </div>
                  <Button type="submit" disabled={profileMutation.isPending}>
                    {profileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save changes
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* ── Preferences ── */}
          {active === 'preferences' && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">App preferences</p>
                <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">Customize how RiEliOS looks and formats data for you</p>
              </div>
              <form
                onSubmit={prefsForm.handleSubmit((d) => prefsMutation.mutate(d))}
                className="space-y-5"
              >
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Currency">
                    <Controller
                      name="currency"
                      control={prefsForm.control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map((c) => (
                              <SelectItem key={c.code} value={c.code}>
                                {c.code} — {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                  <Field label="Timezone">
                    <Controller
                      name="timezone"
                      control={prefsForm.control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIMEZONES.map((tz) => (
                              <SelectItem key={tz} value={tz}>
                                {tz}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                </div>

                <Separator />

                <Field label="Theme">
                  <Controller
                    name="theme"
                    control={prefsForm.control}
                    render={({ field }) => (
                      <div className="grid grid-cols-3 gap-2 max-w-xs">
                        {(
                          [
                            { value: 'light', Icon: Sun, label: 'Light' },
                            { value: 'dark', Icon: Moon, label: 'Dark' },
                            { value: 'system', Icon: Monitor, label: 'System' },
                          ] as const
                        ).map(({ value, Icon, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => field.onChange(value)}
                            className={cn(
                              'flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all',
                              field.value === value
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-zinc-200 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-700',
                            )}
                          >
                            <Icon className="h-5 w-5" />
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </Field>

                <Button type="submit" disabled={prefsMutation.isPending}>
                  {prefsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save preferences
                </Button>
              </form>
            </div>
          )}

          {/* ── Security ── */}
          {active === 'security' && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">Change password</p>
                <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">Use a strong password with at least 8 characters</p>
              </div>
              <form
                onSubmit={passwordForm.handleSubmit((d) => passwordMutation.mutate(d))}
                className="space-y-4"
              >
                <Field
                  label="Current password"
                  error={passwordForm.formState.errors.currentPassword?.message}
                >
                  <Input id="currentPassword" type="password" {...passwordForm.register('currentPassword')} />
                </Field>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <Field label="New password" error={passwordForm.formState.errors.newPassword?.message}>
                    <Input id="newPassword" type="password" {...passwordForm.register('newPassword')} />
                  </Field>
                  <Field label="Confirm new password" error={passwordForm.formState.errors.confirmPassword?.message}>
                    <Input id="confirmPassword" type="password" {...passwordForm.register('confirmPassword')} />
                  </Field>
                </div>

                <Button type="submit" disabled={passwordMutation.isPending}>
                  {passwordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update password
                </Button>
              </form>
            </div>
          )}

        </div>
      </div>
      </div>
    </div>
  )
}
