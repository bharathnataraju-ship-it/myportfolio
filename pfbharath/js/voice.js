// Voice Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const speechRecognition = SpeechRecognition ? new SpeechRecognition() : null;
const speechSynthesisSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
let isListening = false;
let currentVoiceGender = 'male';

// Theme Management
const themeToggle = document.getElementById('themeToggle');
const voiceToggle = document.getElementById('voiceToggle');
const voiceSettings = document.getElementById('voiceSettings');
const voiceModal = document.getElementById('voiceModal');
const closeModal = document.querySelector('.close');
const voiceIndicator = document.getElementById('voiceIndicator');
const voiceStatusText = document.getElementById('voiceStatus');

function setVoiceStatus(text) {
    if (voiceStatusText) {
        voiceStatusText.textContent = text;
    }
}

// Initialize theme from localStorage
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function updateThemeIcon(theme) {
    if (themeToggle) {
        themeToggle.querySelector('.theme-icon').textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

// Theme Toggle
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        announceToUser(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode enabled`);
    });
}

// Voice Settings Modal
if (voiceSettings) {
    voiceSettings.addEventListener('click', () => {
        if (voiceModal) {
            voiceModal.classList.add('show');
        }
    });
}

if (closeModal) {
    closeModal.addEventListener('click', () => {
        if (voiceModal) {
            voiceModal.classList.remove('show');
        }
    });
}

window.addEventListener('click', (event) => {
    if (event.target === voiceModal) {
        voiceModal.classList.remove('show');
    }
});

// Update voice gender selection
const voiceGenderRadios = document.querySelectorAll('input[name="voice-gender"]');
voiceGenderRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        currentVoiceGender = e.target.value;
        localStorage.setItem('voiceGender', currentVoiceGender);
        announceToUser(`Voice changed to ${currentVoiceGender}`);
    });
});

// Load saved voice gender
function loadVoiceSettings() {
    currentVoiceGender = localStorage.getItem('voiceGender') || 'male';
    const radio = document.querySelector(`input[name="voice-gender"][value="${currentVoiceGender}"]`);
    if (radio) {
        radio.checked = true;
    }
}

// Available voice commands
const voiceCommands = {
    'home': () => navigateToSection('hero'),
    'about': () => navigateToSection('about'),
    'skills': () => navigateToSection('skills'),
    'projects': () => navigateToSection('projects'),
    'education': () => navigateToSection('education'),
    'certificates': () => navigateToSection('certificates'),
    'contact': () => navigateToSection('contact'),
    'read page': () => readCurrentSection(),
};

// Navigate to section
function navigateToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        announceToUser(`Navigating to ${sectionId}`);
    }
}

// Read current section
function readCurrentSection() {
    const sections = document.querySelectorAll('.section, #hero');
    let currentSection = null;

    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
            currentSection = section;
        }
    });

    if (currentSection) {
        announceToUser(currentSection.innerText);
    }
}

// Text-to-Speech with voice selection
function announceToUser(text) {
    setVoiceStatus(text);

    if (!speechSynthesisSupported) {
        console.warn('Speech synthesis not supported in this browser.');
        return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();

    let selectedVoice;
    if (currentVoiceGender === 'female') {
        selectedVoice = voices.find(voice => voice.name.toLowerCase().includes('female')) ||
                       voices.find(voice => voice.name.toLowerCase().includes('woman')) ||
                       voices.find(voice => voice.name.toLowerCase().includes('samantha')) ||
                       voices.find(voice => voice.name.toLowerCase().includes('victoria')) ||
                       voices[1] || voices[0];
    } else {
        selectedVoice = voices.find(voice => voice.name.toLowerCase().includes('male')) ||
                       voices.find(voice => voice.name.toLowerCase().includes('man')) ||
                       voices.find(voice => voice.name.toLowerCase().includes('alex')) ||
                       voices[0];
    }

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    utterance.rate = 0.9;
    utterance.pitch = currentVoiceGender === 'female' ? 1.2 : 0.8;
    utterance.volume = 1;
    synth.speak(utterance);
}

if (speechRecognition) {
    speechRecognition.continuous = false;
    speechRecognition.interimResults = true;
    speechRecognition.lang = 'en-US';

    speechRecognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }

        const recognizedText = finalTranscript || interimTranscript;
        setVoiceStatus(`Recognized: ${recognizedText}`);

        if (finalTranscript) {
            processVoiceCommand(finalTranscript.toLowerCase().trim());
        }
    };

    speechRecognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        announceToUser(`Error: ${event.error}`);
        setVoiceStatus(`Error: ${event.error}`);
    };

    speechRecognition.onend = () => {
        isListening = false;
        if (voiceToggle) {
            voiceToggle.innerHTML = '<span class="voice-icon">🎤</span>';
        }
        if (voiceIndicator) {
            voiceIndicator.classList.remove('show');
        }
    };
}

// Process voice command
function processVoiceCommand(command) {
    let isCommandFound = false;

    for (const [key, action] of Object.entries(voiceCommands)) {
        if (command.includes(key)) {
            action();
            isCommandFound = true;
            break;
        }
    }

    if (!isCommandFound) {
        announceToUser('Command not recognized. Please try: home, about, skills, projects, education, contact, or read page');
        setVoiceStatus('Command not recognized');
    } else {
        setVoiceStatus('Command executed');
        setTimeout(() => {
            if (!isListening && voiceIndicator) {
                voiceIndicator.classList.remove('show');
            }
        }, 2000);
    }
}

// Voice Toggle Button
if (voiceToggle) {
    voiceToggle.addEventListener('click', () => {
        if (!speechRecognition) {
            announceToUser('Speech recognition not supported in this browser.');
            return;
        }

        if (isListening) {
            speechRecognition.stop();
            isListening = false;
            voiceToggle.innerHTML = '<span class="voice-icon">🎤</span>';
            if (voiceIndicator) {
                voiceIndicator.classList.remove('show');
            }
            announceToUser('Voice command disabled');
        } else {
            try {
                speechRecognition.start();
                isListening = true;
                voiceToggle.innerHTML = '<span class="voice-icon">🔴</span>';
                if (voiceIndicator) {
                    voiceIndicator.classList.add('show');
                }
                setVoiceStatus('Listening...');
                announceToUser('Voice command enabled. Say a command');
            } catch (error) {
                console.error('Error starting speech recognition:', error);
                announceToUser('Error: Speech recognition not available');
            }
        }
    });
}

if (speechSynthesisSupported) {
    window.speechSynthesis.onvoiceschanged = () => {
        loadVoiceSettings();
    };
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    loadVoiceSettings();

    if (!speechRecognition && voiceToggle) {
        voiceToggle.disabled = true;
        voiceToggle.title = 'Speech recognition not supported in this browser';
    }

    if (voiceModal) {
        voiceModal.classList.remove('show');
    }

    setTimeout(() => {
        announceToUser('Welcome to my portfolio. Click the microphone button to use voice commands');
    }, 1000);
});

// Handle navbar scroll effects
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar && window.scrollY > 50) {
        navbar.style.backgroundColor = window.getComputedStyle(document.documentElement).getPropertyValue('--bg-primary');
    }
});
