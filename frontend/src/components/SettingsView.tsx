import { Moon, Sun } from 'lucide-react';

type SettingsViewProps = {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
};

export default function SettingsView({ isDarkMode, onToggleDarkMode }: SettingsViewProps) {
  return (
    <div className="settings-view" style={{ padding: '40px' }}>
      <h1 className="desk-title">Settings</h1>
      <div className="settings-section" style={{ marginTop: '32px', backgroundColor: 'var(--card-bg)', borderRadius: '16px', padding: '24px', border: '1px solid var(--card-border)' }}>
        <h2 style={{ fontSize: '18px', margin: '0 0 16px', color: 'var(--text-primary)' }}>Appearance</h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderTop: '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>Dark Mode</span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Toggle between light and dark theme</span>
          </div>
          <div>
            <button
              onClick={onToggleDarkMode}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--card-border)', background: 'var(--bg-main)', color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
