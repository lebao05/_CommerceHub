import { useState, useRef, type ChangeEvent, type FormEvent } from 'react';
import {
  User, Package, CreditCard, MapPin, Lock, Bell, ShieldCheck,
  IdCard, LogOut, Camera, Check, Plus,
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { useTranslation } from '../i18n/context';
import type { en } from '../i18n/en';

type Translator = (key: keyof typeof en) => string;

type SectionKey =
  | 'profile'
  | 'banks'
  | 'addresses'
  | 'password'
  | 'notifications'
  | 'privacy'
  | 'personal';

interface UserProfile {
  username: string;
  name: string;
  email: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  dob: string;
  avatar: string | null;
}

interface Address {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  street: string;
  city: string;
  isDefault: boolean;
}

interface Card {
  id: string;
  brand: 'visa' | 'mastercard';
  last4: string;
  exp: string;
}

interface NotificationPrefs {
  promo: boolean;
  order: boolean;
  newsletter: boolean;
}

interface PrivacyPrefs {
  profileVisible: boolean;
  showDob: boolean;
}

const initialProfile: UserProfile = {
  username: 'shopper2024',
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  phone: '+84 901 234 567',
  gender: 'male',
  dob: '1998-06-15',
  avatar: null,
};

const initialAddresses: Address[] = [
  {
    id: 'a1',
    label: 'Home',
    recipient: 'Alex Johnson',
    phone: '+84 901 234 567',
    street: '12 Le Loi, District 1',
    city: 'Ho Chi Minh City',
    isDefault: true,
  },
  {
    id: 'a2',
    label: 'Office',
    recipient: 'Alex Johnson',
    phone: '+84 901 234 567',
    street: '8 Tran Hung Dao, Hoan Kiem',
    city: 'Hanoi',
    isDefault: false,
  },
];

const initialCards: Card[] = [
  { id: 'c1', brand: 'visa', last4: '4242', exp: '08/27' },
];

const initialNotif: NotificationPrefs = {
  promo: true,
  order: true,
  newsletter: false,
};

const initialPrivacy: PrivacyPrefs = {
  profileVisible: true,
  showDob: false,
};

function MyAccountPage() {
  const { t } = useTranslation();
  const [section, setSection] = useState<SectionKey>('profile');
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [draft, setDraft] = useState<UserProfile>(initialProfile);
  const [savedFlash, setSavedFlash] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [cards] = useState<Card[]>(initialCards);
  const [notif, setNotif] = useState<NotificationPrefs>(initialNotif);
  const [privacy, setPrivacy] = useState<PrivacyPrefs>(initialPrivacy);
  const fileRef = useRef<HTMLInputElement>(null);
  const tt = t as Translator;

  // ── Profile handlers ─────────────────────────────────────────────
  const onProfileField = (field: keyof UserProfile, value: string) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  const onAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setDraft(prev => ({ ...prev, avatar: url }));
    };
    reader.readAsDataURL(file);
  };

  const onSaveProfile = (e: FormEvent) => {
    e.preventDefault();
    setProfile(draft);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  };

  const onSetDefaultAddress = (id: string) => {
    setAddresses(prev =>
      prev.map(a => ({ ...a, isDefault: a.id === id }))
    );
  };

  const onRemoveAddress = (id: string) => {
    setAddresses(prev => prev.filter(a => a.id !== id));
  };

  // ── Sidebar items ────────────────────────────────────────────────
  const sidebarItems: Array<{
    key: SectionKey;
    icon: typeof User;
    label: string;
  }> = [
    { key: 'profile', icon: User, label: tt('accountMyProfile') },
    { key: 'banks', icon: CreditCard, label: tt('accountBanks') },
    { key: 'addresses', icon: MapPin, label: tt('accountAddresses') },
    { key: 'password', icon: Lock, label: tt('accountChangePassword') },
    { key: 'notifications', icon: Bell, label: tt('accountNotificationSettings') },
    { key: 'privacy', icon: ShieldCheck, label: tt('accountPrivacy') },
    { key: 'personal', icon: IdCard, label: tt('accountPersonalInfo') },
  ];

  return (
    <MainLayout>
      <div style={{ backgroundColor: 'var(--color-background)', minHeight: '100%' }}>
        {/* Page-level strip (Shopee-like account header) */}
        <div style={{
          background: 'linear-gradient(135deg, #EE4D2D 0%, #F97316 100%)',
          height: '120px',
        }} />

        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 var(--spacing-md) var(--spacing-3xl)',
          marginTop: '-70px',
        }}>
          {/* User card overlapping the gradient strip */}
          <div style={{
            backgroundColor: 'var(--color-background)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-lg) var(--spacing-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xl)',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: 'var(--spacing-lg)',
            flexWrap: 'wrap',
          }}>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '4px solid var(--color-background)',
              overflow: 'hidden',
              color: 'var(--color-text-secondary)',
            }}>
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt="avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <User size={42} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>
                  {profile.name}
                </h1>
                <span style={{
                  background: 'linear-gradient(90deg, #EE4D2D, #F97316)',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                }}>
                  {t('accountLevel')}
                </span>
              </div>
              <div style={{
                color: 'var(--color-text-secondary)',
                fontSize: '13px',
                marginTop: '4px',
              }}>
                @{profile.username} · {profile.email}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSection('profile')}
              style={{
                border: '1px solid var(--color-accent-warm)',
                color: 'var(--color-accent-warm)',
                background: 'transparent',
                padding: '8px 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {t('accountEditProfile')}
            </button>
          </div>

          {/* 2-column layout: sidebar + content */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 260px) 1fr',
            gap: 'var(--spacing-lg)',
            alignItems: 'start',
          }}>
            {/* Sidebar */}
            <aside style={{
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              position: 'sticky',
              top: '120px',
            }}>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {sidebarItems.map(({ key, icon: Icon, label }) => {
                  const isActive = section === key;
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => setSection(key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          width: '100%',
                          padding: '14px 20px',
                          background: isActive
                            ? 'rgba(238, 77, 45, 0.08)'
                            : 'transparent',
                          color: isActive
                            ? 'var(--color-accent-warm)'
                            : 'var(--color-text-primary)',
                          border: 'none',
                          borderLeft: isActive
                            ? '3px solid var(--color-accent-warm)'
                            : '3px solid transparent',
                          textAlign: 'left',
                          fontSize: '14px',
                          fontWeight: isActive ? 600 : 500,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => {
                          if (!isActive) e.currentTarget.style.backgroundColor = 'var(--color-border)';
                        }}
                        onMouseLeave={e => {
                          if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Icon size={18} />
                        {label}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div style={{ height: '1px', backgroundColor: 'var(--color-border)' }} />
              <button
                type="button"
                onClick={() => {
                  // TODO: clear auth state
                  window.location.href = '/login';
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '14px 20px',
                  background: 'transparent',
                  color: 'var(--color-error)',
                  border: 'none',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-border)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <LogOut size={18} />
                {t('logout')}
              </button>
            </aside>

            {/* Content */}
            <section style={{
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--spacing-xl)',
              minHeight: '480px',
            }}>
              {section === 'profile' && (
                <ProfileSection
                  draft={draft}
                  setDraft={setDraft}
                  savedFlash={savedFlash}
                  onField={onProfileField}
                  onAvatarChange={onAvatarChange}
                  onSave={onSaveProfile}
                  fileRef={fileRef}
                  t={tt}
                />
              )}
              {section === 'banks' && <BanksSection cards={cards} t={tt} />}
              {section === 'addresses' && (
                <AddressesSection
                  addresses={addresses}
                  onSetDefault={onSetDefaultAddress}
                  onRemove={onRemoveAddress}
                  t={tt}
                />
              )}
              {section === 'password' && <ChangePasswordSection t={tt} />}
              {section === 'notifications' && (
                <NotificationsSection notif={notif} setNotif={setNotif} t={tt} />
              )}
              {section === 'privacy' && (
                <PrivacySection privacy={privacy} setPrivacy={setPrivacy} t={tt} />
              )}
              {section === 'personal' && <PersonalInfoSection profile={profile} t={tt} />}
            </section>
          </div>
        </div>

        {/* Responsive: stack on small screens */}
        <style>{`
          @media (max-width: 900px) {
            .my-account-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </MainLayout>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Section components
// ──────────────────────────────────────────────────────────────────────

interface ProfileSectionProps {
  draft: UserProfile;
  setDraft: React.Dispatch<React.SetStateAction<UserProfile>>;
  savedFlash: boolean;
  onField: (field: keyof UserProfile, value: string) => void;
  onAvatarChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSave: (e: FormEvent) => void;
  fileRef: React.RefObject<HTMLInputElement>;
  t: Translator;
}

function ProfileSection({
  draft, savedFlash, onField, onAvatarChange, onSave, fileRef, t,
}: ProfileSectionProps) {
  return (
    <>
      <SectionHeader title={t('accountProfileTitle')} />
      <form
        onSubmit={onSave}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 220px',
          gap: 'var(--spacing-2xl)',
          alignItems: 'start',
        }}
      >
        <div>
          <Field label={t('accountUsername')}>
            <input
              type="text"
              value={draft.username}
              onChange={e => onField('username', e.target.value)}
              className="my-account-input"
            />
          </Field>
          <Field label={t('accountName')}>
            <input
              type="text"
              value={draft.name}
              onChange={e => onField('name', e.target.value)}
              className="my-account-input"
            />
          </Field>
          <Field label={t('accountEmail')}>
            <input
              type="email"
              value={draft.email}
              onChange={e => onField('email', e.target.value)}
              className="my-account-input"
            />
          </Field>
          <Field label={t('accountPhone')}>
            <input
              type="tel"
              value={draft.phone}
              onChange={e => onField('phone', e.target.value)}
              className="my-account-input"
            />
          </Field>
          <Field label={t('accountGender')}>
            <div style={{ display: 'flex', gap: 'var(--spacing-lg)' }}>
              {(['male', 'female', 'other'] as const).map(g => (
                <label
                  key={g}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    color: 'var(--color-text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="gender"
                    checked={draft.gender === g}
                    onChange={() => onField('gender', g)}
                    style={{ accentColor: 'var(--color-accent-warm)' }}
                  />
                  {g === 'male' && t('accountGenderMale')}
                  {g === 'female' && t('accountGenderFemale')}
                  {g === 'other' && t('accountGenderOther')}
                </label>
              ))}
            </div>
          </Field>
          <Field label={t('accountDob')}>
            <input
              type="date"
              value={draft.dob}
              onChange={e => onField('dob', e.target.value)}
              className="my-account-input"
            />
          </Field>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-md)',
            marginTop: 'var(--spacing-lg)',
          }}>
            <button
              type="submit"
              style={{
                backgroundColor: 'var(--color-accent-warm)',
                color: '#fff',
                border: 'none',
                padding: '10px 28px',
                borderRadius: 'var(--radius-md)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {t('accountSave')}
            </button>
            {savedFlash && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--color-success)',
                fontSize: '13px',
                fontWeight: 500,
              }}>
                <Check size={16} />
                {t('accountSaved')}
              </span>
            )}
          </div>
        </div>

        {/* Profile photo on the right */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-border)',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            color: 'var(--color-text-secondary)',
            border: '2px dashed var(--color-border)',
            position: 'relative',
          }}>
            {draft.avatar ? (
              <img
                src={draft.avatar}
                alt="avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <User size={72} />
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label={t('accountUploadPhoto')}
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                backgroundColor: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--color-text-primary)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Camera size={18} />
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onAvatarChange}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            style={{
              marginTop: 'var(--spacing-md)',
              fontSize: '13px',
              color: 'var(--color-accent-cool)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 500,
            }}
          >
            {t('accountChangeAvatar')}
          </button>
        </div>
      </form>

      <style>{`
        .my-account-input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: 14px;
          background-color: var(--color-background);
          color: var(--color-text-primary);
          font-family: inherit;
          transition: border-color 0.15s;
        }
        .my-account-input:focus {
          outline: none;
          border-color: var(--color-accent-warm);
        }
        @media (max-width: 700px) {
          .my-account-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}

function BanksSection({ cards, t }: { cards: Card[]; t: Translator }) {
  return (
    <>
      <SectionHeader
        title={t('accountBanksTitle')}
        action={
          <button
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--color-accent-warm)',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Plus size={16} />
            {t('accountBanksAdd')}
          </button>
        }
      />
      {cards.length === 0 ? (
        <EmptyState icon={CreditCard} message={t('accountNoCards')} />
      ) : (
        <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
          {cards.map(c => (
            <div
              key={c.id}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-md) var(--spacing-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-md)',
              }}
            >
              <CreditCard size={28} color="var(--color-accent-warm)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 600, textTransform: 'uppercase' }}>
                  {c.brand} •••• {c.last4}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  Expires {c.exp}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

interface AddressesSectionProps {
  addresses: Address[];
  onSetDefault: (id: string) => void;
  onRemove: (id: string) => void;
  t: Translator;
}

function AddressesSection({ addresses, onSetDefault, onRemove, t }: AddressesSectionProps) {
  return (
    <>
      <SectionHeader
        title={t('accountAddressesTitle')}
        action={
          <button
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--color-accent-warm)',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Plus size={16} />
            {t('accountAddAddress')}
          </button>
        }
      />
      {addresses.length === 0 ? (
        <EmptyState icon={MapPin} message={t('accountNoAddresses')} />
      ) : (
        <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
          {addresses.map(a => (
            <div
              key={a.id}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-md) var(--spacing-lg)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--spacing-md)',
                background: a.isDefault ? 'rgba(238, 77, 45, 0.04)' : 'transparent',
              }}
            >
              <MapPin size={24} color="var(--color-accent-warm)" style={{ marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: '15px' }}>{a.label}</span>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    · {a.recipient} · {a.phone}
                  </span>
                  {a.isDefault && (
                    <span style={{
                      backgroundColor: 'var(--color-accent-warm)',
                      color: '#fff',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                    }}>
                      {t('accountDefault')}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  {a.street}, {a.city}
                </div>
                <div style={{ marginTop: 'var(--spacing-sm)', display: 'flex', gap: 'var(--spacing-md)' }}>
                  {!a.isDefault && (
                    <button
                      type="button"
                      onClick={() => onSetDefault(a.id)}
                      style={linkButtonStyle}
                    >
                      {t('accountDefault')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemove(a.id)}
                    style={{ ...linkButtonStyle, color: 'var(--color-error)' }}
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function ChangePasswordSection({ t }: { t: Translator }) {
  return (
    <>
      <SectionHeader title={t('accountChangePasswordTitle')} />
      <form
        onSubmit={e => e.preventDefault()}
        style={{ display: 'grid', gap: 'var(--spacing-md)', maxWidth: '480px' }}
      >
        <Field label={t('accountCurrentPassword')}>
          <input type="password" className="my-account-input" />
        </Field>
        <Field label={t('accountNewPassword')}>
          <input type="password" className="my-account-input" />
        </Field>
        <Field label={t('accountConfirmNewPassword')}>
          <input type="password" className="my-account-input" />
        </Field>
        <button
          type="submit"
          style={{
            marginTop: 'var(--spacing-sm)',
            backgroundColor: 'var(--color-accent-warm)',
            color: '#fff',
            border: 'none',
            padding: '10px 28px',
            borderRadius: 'var(--radius-md)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            justifySelf: 'start',
            width: 'fit-content',
          }}
        >
          {t('accountUpdatePassword')}
        </button>
      </form>
    </>
  );
}

interface NotificationsSectionProps {
  notif: NotificationPrefs;
  setNotif: React.Dispatch<React.SetStateAction<NotificationPrefs>>;
  t: Translator;
}

function NotificationsSection({ notif, setNotif, t }: NotificationsSectionProps) {
  const rows: Array<{ key: keyof NotificationPrefs; title: string; desc: string }> = [
    { key: 'promo', title: t('accountNotifPromo'), desc: t('accountNotifPromoDesc') },
    { key: 'order', title: t('accountNotifOrder'), desc: t('accountNotifOrderDesc') },
    { key: 'newsletter', title: t('accountNotifNewsletter'), desc: t('accountNotifNewsletterDesc') },
  ];
  return (
    <>
      <SectionHeader title={t('accountNotificationTitle')} />
      <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
        {rows.map(({ key, title, desc }) => (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-md)',
              padding: 'var(--spacing-md) 0',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{title}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                {desc}
              </div>
            </div>
            <Toggle
              checked={notif[key]}
              onChange={v => setNotif(prev => ({ ...prev, [key]: v }))}
            />
          </div>
        ))}
      </div>
    </>
  );
}

interface PrivacySectionProps {
  privacy: PrivacyPrefs;
  setPrivacy: React.Dispatch<React.SetStateAction<PrivacyPrefs>>;
  t: Translator;
}

function PrivacySection({ privacy, setPrivacy, t }: PrivacySectionProps) {
  const rows: Array<{ key: keyof PrivacyPrefs; title: string; desc: string }> = [
    { key: 'profileVisible', title: t('accountPrivacyProfileVisible'), desc: t('accountPrivacyProfileVisibleDesc') },
    { key: 'showDob', title: t('accountPrivacyShowDob'), desc: t('accountPrivacyShowDobDesc') },
  ];
  return (
    <>
      <SectionHeader title={t('accountPrivacyTitle')} />
      <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
        {rows.map(({ key, title, desc }) => (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-md)',
              padding: 'var(--spacing-md) 0',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{title}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                {desc}
              </div>
            </div>
            <Toggle
              checked={privacy[key]}
              onChange={v => setPrivacy(prev => ({ ...prev, [key]: v }))}
            />
          </div>
        ))}
      </div>
    </>
  );
}

function PersonalInfoSection({
  profile,
  t,
}: {
  profile: UserProfile;
  t: Translator;
}) {
  return (
    <>
      <SectionHeader title={t('accountPersonalTitle')} />
      <p style={{
        fontSize: '13px',
        color: 'var(--color-text-secondary)',
        marginBottom: 'var(--spacing-lg)',
      }}>
        {t('accountPersonalNote')}
      </p>
      <div style={{ display: 'grid', gap: 'var(--spacing-md)', maxWidth: '480px' }}>
        <Field label={t('accountPersonalId')}>
          <input
            type="text"
            defaultValue="079XXXXXXXXX"
            className="my-account-input"
            readOnly
          />
        </Field>
        <Field label={t('accountPersonalTaxCode')}>
          <input
            type="text"
            defaultValue="—"
            className="my-account-input"
            readOnly
          />
        </Field>
        <Field label={t('accountEmail')}>
          <input
            type="email"
            defaultValue={profile.email}
            className="my-account-input"
            readOnly
          />
        </Field>
        <Field label={t('accountPhone')}>
          <input
            type="tel"
            defaultValue={profile.phone}
            className="my-account-input"
            readOnly
          />
        </Field>
      </div>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Shared bits
// ──────────────────────────────────────────────────────────────────────

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 'var(--spacing-xl)',
      paddingBottom: 'var(--spacing-md)',
      borderBottom: '1px solid var(--color-border)',
      flexWrap: 'wrap',
      gap: 'var(--spacing-sm)',
    }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>{title}</h2>
      {action}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 'var(--spacing-md)' }}>
      <label style={{
        display: 'block',
        fontSize: '13px',
        color: 'var(--color-text-secondary)',
        marginBottom: '6px',
        fontWeight: 500,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative',
        width: '42px',
        height: '24px',
        borderRadius: '9999px',
        border: 'none',
        backgroundColor: checked ? 'var(--color-accent-warm)' : 'var(--color-border)',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        flexShrink: 0,
        padding: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '2px',
          left: checked ? '20px' : '2px',
          width: '20px',
          height: '20px',
          backgroundColor: '#fff',
          borderRadius: '50%',
          transition: 'left 0.2s',
          boxShadow: 'var(--shadow-sm)',
        }}
      />
    </button>
  );
}

function EmptyState({
  icon: Icon,
  message,
}: {
  icon: typeof Package;
  message: string;
}) {
  return (
    <div style={{
      textAlign: 'center',
      padding: 'var(--spacing-3xl) var(--spacing-md)',
      color: 'var(--color-text-secondary)',
    }}>
      <Icon size={48} style={{ opacity: 0.4, marginBottom: 'var(--spacing-md)' }} />
      <div style={{ fontSize: '14px' }}>{message}</div>
    </div>
  );
}

const linkButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: 'var(--color-accent-cool)',
  fontSize: '13px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontWeight: 500,
};

export default MyAccountPage;
