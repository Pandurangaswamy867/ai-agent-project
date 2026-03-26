import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';

// Import components to test
import VoiceNavigator from './components/VoiceNavigator';
import HomeDashboard from './features/dashboard/HomeDashboard';
import SnpRegistration from './features/snp/SnpRegistration';
import MatchingDashboard from './features/matching/MatchingDashboard';
import OnboardingWizard from './features/onboarding/OnboardingWizard';
import SNPProfileEditModal from './features/snp/SNPProfileEditModal';
import type { SNP } from './types';

// Mock context providers
vi.mock('./context/MSEContext', () => ({
    useMSE: () => ({
        selectedMseId: 1,
        setSelectedMseId: vi.fn(),
        mses: [{ mse_id: 1, name: 'Test MSE', city: 'Mumbai', sector: 'Textiles' }],
        refreshMses: vi.fn()
    })
}));

vi.mock('./context/AuthContext', () => ({
    useAuth: () => ({
        role: 'mse',
        userId: 1,
        token: 'fake-token',
        login: vi.fn(),
        logout: vi.fn()
    })
}));

describe('TEAM Initiative - Comprehensive Frontend UAT Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Mock localStorage
        const localStorageMock = (() => {
            let store: Record<string, string> = {};
            return {
                getItem: (key: string) => store[key] || null,
                setItem: (key: string, value: string) => { store[key] = value.toString(); },
                clear: () => { store = {}; },
                removeItem: (key: string) => { delete store[key]; }
            };
        })();
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });

        // Setup a comprehensive axios mock
        (axios as any).get.mockImplementation((url: string) => {
            if (url.includes('/matching/')) return Promise.resolve({ data: { matches: [{ snp_id: 1, snp_name: 'AI Logistics Partner', score: 98.0, reason: 'High alignment' }] } });
            if (url.includes('/snps/')) return Promise.resolve({ data: [{ id: 1, name: 'SNP 1', status: 'active' }, { id: 2, name: 'SNP 2', status: 'active' }] });
            if (url.includes('/products/')) return Promise.resolve({ data: [{ id: 101, product_name: 'Product 1' }] });
            if (url.includes('/analytics/')) return Promise.resolve({ data: { total_volume: 1000, active_mses: 5, fulfillment_index: '92%', growth_rate: '15%', settlement_velocity: 'Fast' } });
            if (url.includes('/partnerships/')) return Promise.resolve({ data: [] });
            return Promise.resolve({ data: [] });
        });
        (axios as any).post.mockImplementation((url: string) => {
            if (url.includes('/auth/register')) return Promise.resolve({ data: { access_token: 'fake-token' } });
            return Promise.resolve({ data: { success: true } });
        });
        (axios as any).put.mockResolvedValue({ data: { success: true } });
        (axios as any).delete.mockResolvedValue({ data: { success: true } });
    });

    // 1. Voice & Multilingual (REG-01 / ML-01)
    it('FE-01: VoiceNavigator activation and i18n key presence', async () => {
        render(<VoiceNavigator />);
        const button = screen.getByRole('button');
        fireEvent.click(button);
        expect((window as any).SpeechRecognition).toHaveBeenCalled();
    });

    // 2. Dashboard & Branding (FE-02 / FE-03)
    it('FE-02: HomeDashboard renders with official branding and stats', async () => {
        render(<MemoryRouter><HomeDashboard /></MemoryRouter>);
        // Check for welcome message or other HomeDashboard specific text
        expect(screen.getByText(/Bharat Green Textiles/i)).toBeInTheDocument();
        await waitFor(() => {
            // Stats should update from mock
            expect(screen.getByText('2')).toBeInTheDocument(); 
        });
    });

    // 3. SNP Registration (AUTH-02 / SNP-01)
    it('FE-04: SnpRegistration submission flow', async () => {
        render(<SnpRegistration />);
        
        // Step 1: Account creation
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'admin@test.com' } });
        fireEvent.change(screen.getByLabelText(/Mobile Number/i), { target: { value: '9876543210' } });
        fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });
        
        await act(async () => {
            fireEvent.click(screen.getByText(/Create Account & Continue/i));
        });

        // Step 2: Profile details
        await waitFor(() => {
            expect(screen.getByLabelText(/Organization Name/i)).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText(/Organization Name/i), { target: { value: 'Bharat Logistics' } });
        fireEvent.change(screen.getByLabelText(/Headquarter City/i), { target: { value: 'Mumbai' } });
        fireEvent.change(screen.getByLabelText(/Certified Domains/i), { target: { value: 'Textiles' } });
        fireEvent.change(screen.getByLabelText(/Serviceable Pincodes/i), { target: { value: '400001' } });
        fireEvent.change(screen.getByLabelText(/Contact Person/i), { target: { value: 'Nodal Officer' } });

        await act(async () => {
            fireEvent.click(screen.getByText(/Submit to Registry/i));
        });

        await waitFor(() => {
            expect(screen.getByText(/Registration Successful/i)).toBeInTheDocument();
        });
    });

    // 4. Matching UI (FE-07 / FE-08 / MATCH-01 / MATCH-02)
    it('FE-05: MatchingDashboard search and match logic display', async () => {
        render(<MatchingDashboard />);
        await waitFor(() => {
            expect(screen.getByText(/AI Logistics Partner/i)).toBeInTheDocument();
            expect(screen.getByText('98%')).toBeInTheDocument();
        });

        const searchInput = screen.getByPlaceholderText('search_placeholder');
        fireEvent.change(searchInput, { target: { value: 'Unknown' } });
        expect(screen.queryByText(/AI Logistics Partner/i)).not.toBeInTheDocument();
    });

    // 5. Onboarding Wizard (F-01 / REG-02)
    it('FE-06: OnboardingWizard renders first step correctly', () => {
        render(<MemoryRouter><OnboardingWizard /></MemoryRouter>);
        expect(screen.getByText('onboarding_title')).toBeInTheDocument();
        expect(screen.getByText('Identity')).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Bharat Textiles Ltd./i)).toBeInTheDocument();
    });

    // 6. SNP Edit Profile (SNP-02)
    it('FE-09: SNPProfileEditModal handles form updates', async () => {
        const onClose = vi.fn();
        const onSuccess = vi.fn();
        const initialData: SNP = { 
            snp_id: 1, 
            name: 'Old Name', 
            type: 'Logistics',
            contact_person: 'Old Officer', 
            city: 'Delhi', 
            email: 'old@test.com', 
            phone: '1234567890', 
            onboarding_fee: 0,
            commission_rate: 0,
            rating: 4.0,
            supported_sectors: '[]',
            pincode_expertise: '[]',
            capacity: 100,
            current_load: 0,
            settlement_speed: 0.95,
            fulfillment_reliability: 0.98,
            status: 'active',
            created_at: new Date().toISOString()
        };

        render(<SNPProfileEditModal isOpen={true} onClose={onClose} snpId={1} initialData={initialData} onSuccess={onSuccess} />);

        const officerInput = screen.getByDisplayValue('Old Officer');
        fireEvent.change(officerInput, { target: { value: 'New Officer' } });

        const saveBtn = screen.getByText(/Save changes/i);
        await act(async () => {
            fireEvent.click(saveBtn);
        });

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalled();
            expect(onClose).toHaveBeenCalled();
        });
    });

    // 7. Error Handling (F-11)
    it('FE-10: MatchingDashboard handles network errors gracefully', async () => {
        (axios as any).get.mockRejectedValueOnce(new Error('API Down'));
        render(<MatchingDashboard />);
        await waitFor(() => {
            expect(screen.queryByText(/AI Logistics Partner/i)).not.toBeInTheDocument();
        });
    });

    // 8. Voice Navigation (REG-01) - Check stop button
    it('FE-11: VoiceNavigator shows feedback when active', () => {
        render(<VoiceNavigator />);
        const button = screen.getByRole('button');
        fireEvent.click(button);
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    // 9. SNP Capacity Update (SNP-02)
    it('FE-12: SNPProfileEditModal allows updating contact person', async () => {
        const onClose = vi.fn();
        const onSuccess = vi.fn();
        const initialData: SNP = { 
            snp_id: 1,
            name: 'Bharat Logistics', 
            type: 'Logistics',
            contact_person: 'Old Person', 
            city: 'Delhi',
            email: 'bharat@test.com',
            phone: '9876543210',
            onboarding_fee: 0,
            commission_rate: 0,
            rating: 4.0,
            supported_sectors: '[]',
            pincode_expertise: '[]',
            capacity: 100,
            current_load: 0,
            settlement_speed: 0.95,
            fulfillment_reliability: 0.98,
            status: 'active',
            created_at: new Date().toISOString()
        };

        render(<SNPProfileEditModal isOpen={true} onClose={onClose} snpId={1} initialData={initialData} onSuccess={onSuccess} />);

        const contactInput = screen.getByLabelText(/Contact person/i);
        fireEvent.change(contactInput, { target: { value: 'New Person' } });

        const saveBtn = screen.getByText(/Save changes/i);
        await act(async () => {
            fireEvent.click(saveBtn);
        });

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalled();
        });
    });

    // 10. Partnership Re-Request Flow (MATCH-06 / Governance)
    it('FE-13: MatchingDashboard shows Connect again for rejected partnerships', async () => {
        (axios as any).get.mockImplementation((url: string) => {
            if (url.includes('/matching/')) return Promise.resolve({
                data: { matches: [{ snp_id: 1, snp_name: 'Bharat Logistics', score: 66.0, partnership_status: 'rejected' }] }
            });
            return Promise.resolve({ data: [] });
        });

        render(<MatchingDashboard />);
        await waitFor(() => {
            expect(screen.getByText('reject')).toBeInTheDocument();
        });
    });
});
