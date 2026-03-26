import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Web Speech API
const mockSpeechRecognition = vi.fn().mockImplementation(function () {
    return {
        start: vi.fn(),
        stop: vi.fn(),
        onstart: null,
        onerror: null,
        onresult: null,
        onend: null,
        lang: '',
        interimResults: false,
        maxAlternatives: 1,
    };
});

(window as any).SpeechRecognition = mockSpeechRecognition;
(window as any).webkitSpeechRecognition = mockSpeechRecognition;

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            if (key === 'hero_title') return 'Official Portal: TEAM Initiative';
            return key;
        },
        i18n: {
            changeLanguage: vi.fn(),
            language: 'en',
        },
    }),
}));

// Mock axios
vi.mock('axios', () => {
    return {
        default: {
            get: vi.fn(),
            post: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
            interceptors: {
                request: { use: vi.fn(), eject: vi.fn() },
                response: { use: vi.fn(), eject: vi.fn() },
            },
        },
    };
});

// Mock MSEContext
vi.mock('./context/MSEContext', () => ({
    useMSE: () => ({
        selectedMseId: 1,
        setSelectedMseId: vi.fn(),
        mses: [{ mse_id: 1, name: 'Test MSE' }],
        refreshMses: vi.fn(),
    }),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        useNavigate: () => vi.fn(),
    };
});
