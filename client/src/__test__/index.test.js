import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '@/pages/index';
import { act } from 'react';

process.env.NEXT_PUBLIC_API_URL = 'http://test-api.com';
global.fetch = jest.fn();

const createMockFile = (size = 100, name = 'chessboard.png') => {
    const content = size > 100 ? 'x'.repeat(size) : 'dummy content';
    return new File([content], name, { type: 'image/png' });
};

const setupFileReader = (result = 'data:image/png;base64,dummy') => {
    const fileReaderMock = {
        readAsDataURL: jest.fn(),
        result,
        onload: null
    };
    global.FileReader = jest.fn(() => fileReaderMock);
    return fileReaderMock;
};

const uploadFile = (file) => {
    const input = screen.getByLabelText(/Select Chessboard Image/i);
    const fileReaderMock = setupFileReader();

    fireEvent.change(input, { target: { files: [file] } });

    act(() => {
        fileReaderMock.onload({ target: fileReaderMock });
    });
};

describe('Home Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch.mockClear();
    });

    it('renders the home page with correct initial state', () => {
        render(<Home apiUrl="http://test-api.com" />);

        expect(screen.getByText('Chess Assistant ♔ ✓')).toBeInTheDocument();
        expect(screen.getByText(/Upload a screenshot of your chessboard/)).toBeInTheDocument();
        expect(screen.getByText('Get suggestion for:')).toBeInTheDocument();

        const whiteRadio = screen.getByLabelText('White');
        const blackRadio = screen.getByLabelText('Black');
        expect(whiteRadio).toBeInTheDocument();
        expect(blackRadio).toBeInTheDocument();
        expect(whiteRadio).toBeChecked();

        const hintButton = screen.getByText('Get Hint');
        expect(hintButton).toBeInTheDocument();
        expect(hintButton).toBeDisabled();
    });

    it('enables the hint button after file selection', () => {
        render(<Home apiUrl="http://test-api.com" />);

        uploadFile(createMockFile());

        expect(screen.getByText('Preview Your Chessboard:')).toBeInTheDocument();
        expect(screen.getByText('Get Hint')).not.toBeDisabled();
    });

    it('shows error message for oversized files', () => {
        render(<Home apiUrl="http://test-api.com" />);

        // Create and upload a file that exceeds the max size (2MB)
        const largeFile = createMockFile(3 * 1024 * 1024, 'large.png');
        const input = screen.getByLabelText(/Select Chessboard Image/i);

        fireEvent.change(input, { target: { files: [largeFile] } });

        expect(screen.getByText(/File size exceeds 2MB limit/)).toBeInTheDocument();
    });

    it('allows switching between white and black player sides', () => {
        render(<Home apiUrl="http://test-api.com" />);

        const whiteRadio = screen.getByLabelText('White');
        const blackRadio = screen.getByLabelText('Black');

        fireEvent.click(blackRadio);
        expect(whiteRadio).not.toBeChecked();
        expect(blackRadio).toBeChecked();

        fireEvent.click(whiteRadio);
        expect(whiteRadio).toBeChecked();
        expect(blackRadio).not.toBeChecked();
    });

    describe('API interactions', () => {
        beforeEach(() => {
            global.fetch.mockReset();
        });

        it('displays loading state and success response', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ suggestion: 'pawn --> e5' }),
            });

            render(<Home apiUrl="http://test-api.com" />);
            uploadFile(createMockFile());

            fireEvent.click(screen.getByText('Get Hint'));

            expect(screen.getByText('Analyzing your chessboard...')).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.getByText('Suggested Move for white:')).toBeInTheDocument();
                expect(screen.getByText('pawn --> e5')).toBeInTheDocument();
            });

            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(global.fetch).toHaveBeenCalledWith(
                'http://test-api.com/api/chess-assistant',
                expect.any(Object)
            );
        });

        it('handles API errors appropriately', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: 'Could not detect chess pieces' }),
            });

            render(<Home apiUrl="http://test-api.com" />);
            uploadFile(createMockFile());

            fireEvent.click(screen.getByText('Get Hint'));

            await waitFor(() => {
                expect(screen.getByText('Could not detect chess pieces')).toBeInTheDocument();
            });
        });
    });
});