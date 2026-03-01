import { KeyRound, Shuffle, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navLinks = [
  { to: '/claves', icon: KeyRound, label: 'Claves' },
  { to: '/generador', icon: Shuffle, label: 'Generar' },
  { to: '/ajustes', icon: Settings, label: 'Ajustes' },
];

export default function ExtensionNav() {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, height: 52,
      background: 'white', borderTop: '1px solid #E2E8F0',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      zIndex: 40, padding: '0 8px',
    }}>
      {navLinks.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) => ({
              display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
              gap: 2, padding: '6px 16px', borderRadius: 10,
              textDecoration: 'none', transition: 'color 0.15s',
              color: isActive ? '#16A34A' : '#94A3B8',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon style={{ width: 20, height: 20 }} strokeWidth={isActive ? 2.5 : 2} />
                <span style={{
                  fontSize: 10, lineHeight: '12px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#16A34A' : '#64748B',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {link.label}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </div>
  );
}
