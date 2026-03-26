import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import type { User, UserRole } from '../types';

interface AuthContextType {
    role: UserRole | null;
    userId: number | null;
    profileId: number | null;
    login: (role: UserRole, id?: number, token?: string, profId?: number) => void;
    logout: () => void;
    isAuthenticated: boolean;
    user: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [role, setRole] = useState<UserRole | null>(() => {
        return localStorage.getItem('authRole') as UserRole || null;
    });

    const [userId, setUserId] = useState<number | null>(() => {
        const saved = localStorage.getItem('authUserId');
        return saved ? parseInt(saved) : null;
    });

    const [profileId, setProfileId] = useState<number | null>(() => {
        const saved = localStorage.getItem('authProfileId');
        return saved ? parseInt(saved) : null;
    });

    const [user] = useState<User | null>(null);

    const login = (newRole: UserRole, id?: number, token?: string, profId?: number) => {
        setRole(newRole);
        if (newRole) {
            localStorage.setItem('authRole', newRole);
        } else {
            localStorage.removeItem('authRole');
        }

        if (id) {
            setUserId(id);
            localStorage.setItem('authUserId', id.toString());
        } else {
            setUserId(null);
            localStorage.removeItem('authUserId');
        }

        if (profId) {
            setProfileId(profId);
            localStorage.setItem('authProfileId', profId.toString());
        }

        if (token) {
            localStorage.setItem('authToken', token);
        }
    };

    // Helper to update profileId from components
    useEffect(() => {
        if (profileId) {
            localStorage.setItem('authProfileId', profileId.toString());
        } else {
            localStorage.removeItem('authProfileId');
        }
    }, [profileId]);

    const logout = useCallback(() => {
        setRole(null);
        setUserId(null);
        setProfileId(null);

        localStorage.removeItem('authRole');
        localStorage.removeItem('authUserId');
        localStorage.removeItem('authProfileId');
        localStorage.removeItem('authToken');
        localStorage.removeItem('selectedMseId');
        localStorage.removeItem('onboarding_data');
        localStorage.removeItem('onboarding_step');
        localStorage.removeItem('onboarding_pass');

        delete axios.defaults.headers.common['Authorization'];
        window.location.href = '/';
    }, []);

    useEffect(() => {
        const handleSessionExpired = () => {
            setRole(null);
            setUserId(null);
            setProfileId(null);
            delete axios.defaults.headers.common['Authorization'];
            window.location.href = '/';
        };
        window.addEventListener('session-expired', handleSessionExpired);
        return () => window.removeEventListener('session-expired', handleSessionExpired);
    }, []);

    // Sync profileId if we're logged in but don't have it
    useEffect(() => {
        const syncProfile = async () => {
            const token = localStorage.getItem('authToken');
            if (role && !profileId && token) {
                try {
                    // Try to get /me to find profile_id
                    const config = { headers: { Authorization: `Bearer ${token}` } };
                    const res = await axios.get('http://localhost:8000/api/v1/auth/me', config);
                    if (res.data.profile_id) {
                        setProfileId(res.data.profile_id);
                    }
                } catch (e) {
                    console.error("Sync profile failed", e);
                }
            }
        };
        syncProfile();
    }, [role, profileId]);

    return (
        <AuthContext.Provider value={{ role, userId, profileId, login, logout, isAuthenticated: !!role, user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
