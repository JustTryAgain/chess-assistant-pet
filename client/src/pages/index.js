import {useState, useRef} from 'react';
import Head from 'next/head';
import styles from '@/styles/Home.module.css';
import Image from 'next/image';

export async function getStaticProps() {
    return {
        props: {
            apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002',
        },
        revalidate: 86400,
    };
}

export default function Home() {
    const [previewSrc, setPreviewSrc] = useState('');
    const [moveSuggestion, setMoveSuggestion] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [playerSide, setPlayerSide] = useState('white');
    const [isLoading, setIsLoading] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [showError, setShowError] = useState(false);

    const fileInputRef = useRef(null);
    const MAX_FILE_SIZE = 2 * 1024 * 1024;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

    const handleFileChange = (e) => {
        if (showError) {
            setShowError(false);
            setErrorMessage('');
        }

        if (showResult) {
            setShowResult(false);
            setMoveSuggestion('');
        }

        if (e.target.files.length > 0) {
            const file = e.target.files[0];

            if (file.size > MAX_FILE_SIZE) {
                setErrorMessage(`File size exceeds 2MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
                setShowError(true);
                setPreviewSrc('');

                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }

                return;
            }


            const reader = new FileReader();

            reader.onload = (e) => {
                setPreviewSrc(e.target.result);
                setShowResult(false);
                setShowError(false);
            };

            reader.readAsDataURL(file);
        }
    };

    const handlePlayerSideChange = (e) => {
        if (showError) {
            setShowError(false);
            setErrorMessage('');
        }

        if (showResult) {
            setShowResult(false);
            setMoveSuggestion('');
        }

        setPlayerSide(e.target.value);
    };

    const handleSubmit = async () => {
        if (!fileInputRef.current.files.length) {
            setErrorMessage('Please select an image first!');
            setShowError(true);
            return;
        }

        setIsLoading(true);
        setShowResult(false);
        setShowError(false);
        setErrorMessage('');

        const formData = new FormData();
        formData.append('chessboard', fileInputRef.current.files[0]);
        formData.append('playerSide', playerSide);

        try {
            const response = await fetch(`${apiUrl}/api/chess-assistant`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Server error');
            }

            setMoveSuggestion(data.suggestion);
            setShowResult(true);
        } catch (error) {
            console.error('Error:', error);
            setErrorMessage(error.message || 'Error processing your request. Please try again.');
            setShowError(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                <meta name="description" content="Get chess move suggestions from your board position"/>
                <title>Chess Assistant</title>
            </Head>

            <div className={styles.container}>
                <header>
                    <div className={styles.logoContainer}>
                        <Image src="/images/chess-logo.png" width={50} height={50} alt="Chess Assistant Logo"/>
                        <h1 className={styles.title}>Chess Assistant ♔ ✓</h1>
                    </div>
                </header>

                <main>
                    <section className={styles.uploadSection}>
                        <p className={styles.instruction}>Upload a screenshot of your chessboard to get a hint for your
                            next move.<br/> Requirements: Image files only, maximum size 2MB</p>

                        <p>Get suggestion for:</p>
                        <div className={styles.radioGroup}>
                            <label className={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name="playerSide"
                                    value="white"
                                    checked={playerSide === 'white'}
                                    onChange={handlePlayerSideChange}
                                />
                                White
                            </label>
                            <label className={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name="playerSide"
                                    value="black"
                                    checked={playerSide === 'black'}
                                    onChange={handlePlayerSideChange}
                                />
                                Black
                            </label>
                        </div>

                        <div className={styles.actionsContainer}>
                            <label htmlFor="chessboard-image" className={styles.uploadBtn}>
                                Select Chessboard Image
                            </label>
                            <input
                                type="file"
                                id="chessboard-image"
                                className={styles.fileInput}
                                accept="image/*, .png, .jpg, .jpeg"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />

                            <button
                                className={previewSrc ? styles.uploadBtn : styles.disabledBtn}
                                onClick={handleSubmit}
                                disabled={!previewSrc}
                            >
                                Get Hint
                            </button>
                        </div>

                        {previewSrc && (
                            <div className={styles.previewContainer}>
                                <p>Preview Your Chessboard:</p>
                                <img src={previewSrc} alt="Chessboard preview" className={styles.previewImage}/>
                            </div>
                        )}
                    </section>

                    <section className={styles.resultSection}>
                        {isLoading && (
                            <div className={styles.loadingContainer}>
                                <div className={styles.spinner}></div>
                                <p>Analyzing your chessboard...</p>
                            </div>
                        )}

                        {showError && (
                            <p className={styles.errorMessage}>
                                {errorMessage}
                            </p>
                        )}

                        {showResult && (
                            <div className={styles.suggestionContainer}>
                                <h3>Suggested Move for {playerSide}:</h3>
                                <p className={styles.moveText}>{moveSuggestion}</p>
                            </div>
                        )}
                    </section>
                </main>

                <footer>
                    <div className={styles.footerContent}>
                        <p>&copy; 2025 Chess Assistant. All rights reserved.</p>
                        <p>Developed by <a href="#" className={styles.link}>Kirill Butyrin</a> and powered by <a
                            href="https://mistral.ai/" target={'_blank'} className={styles.link}>MistralAI</a></p>
                    </div>
                </footer>
            </div>
        </>
    );
}