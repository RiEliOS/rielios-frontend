import { useEffect, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Sun, Moon, Monitor, Camera } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/services/api'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'
import { useMe } from '@/hooks/useAuth'
import { useDateFormat } from '@/hooks/useDateFormat'
import { cn } from '@/lib/utils'

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

export default function SettingsPage() {
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
    ? (me.profile.fullName as string)
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?'

  const formatDate = (iso: string) => fmtDate(iso, { month: 'long' })

  return (
    <div className="p-6 lg:p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-900">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* ── Profile ── */}
        <TabsContent value="profile">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-6">
            <div>
              <p className="text-base font-bold text-zinc-800">Profile</p>
              <p className="text-sm text-zinc-400">Your personal information</p>
            </div>
            <div className="flex items-center gap-4 pb-6 border-b border-zinc-100">
              <div className="relative shrink-0">
                {me?.profile?.avatarUrl ? (
                  <img
                    src={me.profile.avatarUrl}
                    alt="Avatar"
                    className="h-16 w-16 rounded-2xl object-cover border-2 border-primary/20"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">{initials}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarMutation.isPending}
                  className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow hover:bg-primary/90 transition-colors"
                >
                  {avatarMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Camera className="h-3 w-3" />
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) avatarMutation.mutate(file)
                    e.target.value = ''
                  }}
                />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-zinc-800 truncate">{me?.profile?.fullName ?? user?.email}</p>
                <p className="text-sm text-zinc-400 truncate">{user?.email}</p>
                {user?.createdAt && (
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Member since {formatDate(user.createdAt)}
                  </p>
                )}
              </div>
            </div>

            <form
              onSubmit={profileForm.handleSubmit((d) => profileMutation.mutate(d))}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={user?.email ?? ''} disabled className="bg-zinc-50 text-zinc-400" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" {...profileForm.register('fullName')} placeholder="John Doe" />
                {profileForm.formState.errors.fullName && (
                  <p className="text-xs text-destructive">{profileForm.formState.errors.fullName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">
                  Phone <span className="text-zinc-400 text-xs">(optional)</span>
                </Label>
                <Input id="phone" {...profileForm.register('phone')} placeholder="+1 234 567 890" />
              </div>
              <Button type="submit" disabled={profileMutation.isPending}>
                {profileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Profile
              </Button>
            </form>
          </div>
        </TabsContent>

        {/* ── Preferences ── */}
        <TabsContent value="preferences">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-6">
            <div>
              <p className="text-base font-bold text-zinc-800">Preferences</p>
              <p className="text-sm text-zinc-400">Customize your app experience</p>
            </div>
            <form
              onSubmit={prefsForm.handleSubmit((d) => prefsMutation.mutate(d))}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <Label>Currency</Label>
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
              </div>

              <div className="space-y-1.5">
                <Label>Timezone</Label>
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
              </div>

              <div className="space-y-2">
                <Label>Theme</Label>
                <Controller
                  name="theme"
                  control={prefsForm.control}
                  render={({ field }) => (
                    <div className="inline-flex rounded-xl border border-zinc-200 p-1 gap-1">
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
                            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                            field.value === value
                              ? 'bg-primary text-primary-foreground'
                              : 'text-zinc-500 hover:bg-zinc-100',
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              <Button type="submit" disabled={prefsMutation.isPending}>
                {prefsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Preferences
              </Button>
            </form>
          </div>
        </TabsContent>

        {/* ── Security ── */}
        <TabsContent value="security">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-6">
            <div>
              <p className="text-base font-bold text-zinc-800">Security</p>
              <p className="text-sm text-zinc-400">Update your password</p>
            </div>
            <form
              onSubmit={passwordForm.handleSubmit((d) => passwordMutation.mutate(d))}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...passwordForm.register('currentPassword')}
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-xs text-destructive">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...passwordForm.register('newPassword')}
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-destructive">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...passwordForm.register('confirmPassword')}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={passwordMutation.isPending}>
                {passwordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
