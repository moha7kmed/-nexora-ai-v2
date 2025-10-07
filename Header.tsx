import React from 'react';
import type { SpecialistMode } from '../types';
import { ALL_ACADEMIC_SUBJECTS, ALL_PROGRAMMING_SUBJECTS } from '../types';

interface HeaderProps {
    setSidebarOpen: (isOpen: boolean) => void;
    isSidebarOpen: boolean;
    specialistMode: SpecialistMode;
    setSpecialistMode: (mode: SpecialistMode) => void;
    children: React.ReactNode;
}

const MenuIcon: React.FC<{style?: React.CSSProperties}> = ({style}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={style}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

const ShareIcon: React.FC<{style?: React.CSSProperties}> = ({style}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={style}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.19.026.37.06.55.1a2.25 2.25 0 0 1 4.256 2.13l-2.385.53a2.25 2.25 0 0 0-1.87 2.15M7.217 10.907a2.25 2.25 0 0 1 3.592-.656m-3.592.656-.223.224a2.25 2.25 0 0 0 1.254 3.939l1.242.276a2.25 2.25 0 0 1 1.765 2.441l-.252 1.137a2.25 2.25 0 0 1-2.224 1.94H12.75a2.25 2.25 0 0 1-2.224-1.94l-.252-1.137a2.25 2.25 0 0 1 1.765-2.441l1.242-.276a2.25 2.25 0 0 0 1.254-3.939l-.224-.223a2.25 2.25 0 0 0-3.592.656Z" />
    </svg>
);

const MoreIcon: React.FC<{style?: React.CSSProperties}> = ({style}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={style}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </svg>
);

const CloseIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
    <svg style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);


const Header: React.FC<HeaderProps> = ({ setSidebarOpen, isSidebarOpen, specialistMode, setSpecialistMode, children }) => {
  const allSubjects = [...ALL_ACADEMIC_SUBJECTS, ...ALL_PROGRAMMING_SUBJECTS];
  const specialistName = specialistMode 
    ? allSubjects.find(s => s.key === specialistMode)?.name || specialistMode 
    : '';

  return (
    <header style={{
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem',
        height: '4rem',
        position: 'relative',
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button 
                onClick={() => setSidebarOpen(!isSidebarOpen)} 
                style={{ 
                    padding: '0.5rem', 
                    borderRadius: '0.375rem', 
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--fg-primary)',
                    cursor: 'pointer'
                }}
            >
                <MenuIcon style={{ width: '1.5rem', height: '1.5rem' }}/>
            </button>
        </div>

        <div style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
        }}>
            {children}
            {specialistMode && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'var(--accent)',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '99px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                }}>
                    <span>{specialistName}</span>
                    <button 
                        onClick={() => setSpecialistMode(null)}
                        style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', padding: 0, lineHeight: 1, display: 'flex' }}
                        aria-label="Exit specialist mode"
                    >
                        <CloseIcon style={{width: '1rem', height: '1rem'}} />
                    </button>
                </div>
            )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button style={{padding: '0.5rem', borderRadius: '0.375rem', border: 'none', background: 'transparent', color: 'var(--fg-primary)', cursor: 'pointer'}}>
                <ShareIcon style={{width: '1.25rem', height: '1.25rem'}}/>
            </button>
            <button style={{padding: '0.5rem', borderRadius: '0.375rem', border: 'none', background: 'transparent', color: 'var(--fg-primary)', cursor: 'pointer'}}>
                <MoreIcon style={{width: '1.25rem', height: '1.25rem'}}/>
            </button>
        </div>
    </header>
  );
};

export default Header;