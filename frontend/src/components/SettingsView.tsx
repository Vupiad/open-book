import { Monitor, RotateCcw, Palette, Check } from 'lucide-react';
import type { UserSettings, ThemeMode } from '../types';

type SettingsViewProps = {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onResetSettings: () => void;
};

const THEME_OPTIONS: { id: ThemeMode; name: string; desc: string; bg: string; text: string; accent: string }[] = [
  { id: 'dark', name: 'Classic Dark (Default)', desc: 'Original smooth dark grey palette (#333333)', bg: '#333333', text: '#ffffff', accent: '#68c7d6' },
  { id: 'slate', name: 'Slate Dark', desc: 'Deep slate & zinc palette with high contrast', bg: '#0f172a', text: '#f8fafc', accent: '#10b981' },
  { id: 'light', name: 'Clean Light', desc: 'Crisp, bright white aesthetic for daytime reading', bg: '#ffffff', text: '#1e1e1e', accent: '#10b981' },
  { id: 'amoled', name: 'Pure Black (AMOLED)', desc: 'True #000000 black canvas optimized for OLED displays', bg: '#000000', text: '#ffffff', accent: '#68c7d6' },
  { id: 'sepia', name: 'Cozy Sepia', desc: 'Warm earth tones designed to reduce blue light and eye strain', bg: '#f4ecd8', text: '#433422', accent: '#b45309' },
];

const ACCENT_PRESETS = [
  { name: 'Classic Cyan (Default)', hex: '#68c7d6' },
  { name: 'Emerald Green (GitHub)', hex: '#10b981' },
  { name: 'Teal Blue', hex: '#06b6d4' },
  { name: 'Ocean Blue', hex: '#3b82f6' },
  { name: 'Royal Purple', hex: '#8b5cf6' },
  { name: 'Rose Pink', hex: '#ec4899' },
  { name: 'Sunset Orange', hex: '#f97316' },
  { name: 'Warm Amber', hex: '#f59e0b' },
];

export default function SettingsView({ settings, onUpdateSettings, onResetSettings }: SettingsViewProps) {
  return (
    <div className="settings-view" style={{ padding: '40px', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="desk-title">Settings & Customization</h1>
          <p className="desk-subtitle" style={{ margin: 0 }}>
            Personalize your theme mode and accent color preferences.
          </p>
        </div>
        <button
          onClick={onResetSettings}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '12px',
            border: '1px solid var(--card-border)',
            background: 'var(--card-bg)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
          }}
          title="Reset to recommended defaults"
        >
          <RotateCcw size={16} /> Reset to Defaults
        </button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '840px', paddingBottom: '60px' }}>
        
        {/* Section 1: Theme Mode */}
        <div className="settings-section" style={{ backgroundColor: 'var(--card-bg)', borderRadius: '20px', padding: '28px', border: '1px solid var(--card-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Monitor size={22} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--text-primary)', fontWeight: 600 }}>Theme Mode</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 24px' }}>
            Choose your overall visual aesthetic and reading background.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            {THEME_OPTIONS.map((theme) => {
              const isSelected = settings.theme === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => onUpdateSettings({ theme: theme.id })}
                  style={{
                    borderRadius: '16px',
                    padding: '16px',
                    backgroundColor: theme.bg,
                    border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--card-border)'}`,
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 8px 24px rgba(16, 185, 129, 0.15)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '130px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: theme.text }}>{theme.name}</span>
                      {isSelected && (
                        <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                          <Check size={14} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: '11px', color: theme.id === 'light' || theme.id === 'sepia' ? '#666' : '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                      {theme.desc}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '16px', alignItems: 'center' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: theme.accent }}></div>
                    <div style={{ height: '4px', flex: 1, backgroundColor: theme.id === 'light' || theme.id === 'sepia' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)', borderRadius: '2px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Accent Colors */}
        <div className="settings-section" style={{ backgroundColor: 'var(--card-bg)', borderRadius: '20px', padding: '28px', border: '1px solid var(--card-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Palette size={22} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--text-primary)', fontWeight: 600 }}>Accent Color</h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 24px' }}>
            Select an accent color for progress bars, active highlights, buttons, and heatmap cells.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
            {ACCENT_PRESETS.map((preset) => {
              const isSelected = settings.accent.toLowerCase() === preset.hex.toLowerCase();
              return (
                <button
                  key={preset.hex}
                  onClick={() => onUpdateSettings({ accent: preset.hex })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    border: `1.5px solid ${isSelected ? preset.hex : 'var(--card-border)'}`,
                    backgroundColor: isSelected ? `${preset.hex}15` : 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: isSelected ? 600 : 500,
                    transition: 'all 0.2s ease',
                  }}
                  title={preset.name}
                >
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: preset.hex,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    }}
                  >
                    {isSelected && <Check size={11} strokeWidth={3} />}
                  </div>
                  {preset.name}
                </button>
              );
            })}

            {/* Custom Hex Color Picker */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 16px',
                borderRadius: '12px',
                border: '1.5px dashed var(--card-border)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
              }}
              title="Pick any custom color"
            >
              <input
                type="color"
                value={settings.accent}
                onChange={(e) => onUpdateSettings({ accent: e.target.value })}
                style={{
                  width: '22px',
                  height: '22px',
                  padding: 0,
                  border: 'none',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                }}
              />
              <span>Custom Hex ({settings.accent})</span>
            </label>
          </div>
        </div>

      </div>
    </div>
  );
}
