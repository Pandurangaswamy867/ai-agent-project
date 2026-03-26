import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import { useAuth } from './AuthContext';
import type { MSE } from '../types';

interface MSEContextType {
    selectedMseId: number | null;
    setSelectedMseId: (id: number | null) => void;
    mses: MSE[];
    refreshMses: () => void;
}

const MSEContext = createContext<MSEContextType | undefined>(undefined);

export const MSEProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { role } = useAuth();
    const [selectedMseId, setSelectedMseId] = useState<number | null>(() => {
        const saved = localStorage.getItem('selectedMseId');
        return saved ? parseInt(saved) : null;
    });
    const [mses, setMses] = useState<MSE[]>([]);

    const refreshMses = async () => {
        if (!localStorage.getItem('authToken')) return;
        try {
            if (role === 'mse') {
                const meResponse = await axios.get(`${config.API_BASE_URL}/auth/me`);
                const profileId = meResponse.data?.profile_id;
                if (!profileId) {
                    setMses([]);
                    setSelectedMseId(null);
                    return;
                }
                const mseResponse = await axios.get(`${config.API_BASE_URL}/mses/${profileId}`);
                setMses([mseResponse.data]);
                setSelectedMseId(profileId); // Force it to the user's actual profile
                return;
            }

            if (role === 'nsic' || role === 'admin') {
                const response = await axios.get(`${config.API_BASE_URL}/mses/`);
                const allMses = response.data;
                setMses(allMses);
                
                // If current selectedMseId doesn't exist in the list, reset it
                if (selectedMseId && !allMses.find((m: MSE) => m.mse_id === selectedMseId)) {
                    if (allMses.length > 0) {
                        setSelectedMseId(allMses[0].mse_id);
                    } else {
                        setSelectedMseId(null);
                    }
                } else if (!selectedMseId && allMses.length > 0) {
                    setSelectedMseId(allMses[0].mse_id);
                }
                return;
            }

            setMses([]);
        } catch (err) {
            console.error("Failed to fetch MSEs", err);
        }
    };

    useEffect(() => {
        refreshMses();
    }, [role]);

    useEffect(() => {
        if (selectedMseId) {
            localStorage.setItem('selectedMseId', selectedMseId.toString());
        } else {
            localStorage.removeItem('selectedMseId');
        }
    }, [selectedMseId]);

    return (
        <MSEContext.Provider value={{ selectedMseId, setSelectedMseId, mses, refreshMses }}>
            {children}
        </MSEContext.Provider>
    );
};

export const useMSE = () => {
    const context = useContext(MSEContext);
    if (context === undefined) {
        throw new Error('useMSE must be used within an MSEProvider');
    }
    return context;
};
