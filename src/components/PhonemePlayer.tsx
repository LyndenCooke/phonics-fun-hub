import { useState, useCallback, useEffect } from 'react';
import { Volume2, Loader2 } from 'lucide-react';

// Get API key from environment
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

// Phoneme to pronunciation mapping for ElevenLabs
// Using phonetic approximations that produce correct sounds
const PHONEME_MAP: Record<string, string> = {
  // Single letters - phoneme sounds (not letter names)
  's': 'ssss',        // /s/ - shorter for ElevenLabs
  'a': 'aah',         // /æ/ 
  't': 'tuh',         // /t/
  'p': 'puh',         // /p/
  'i': 'ih',          // /ɪ/
  'n': 'nnn',         // /n/
  'm': 'mmm',         // /m/
  'd': 'duh',         // /d/
  'g': 'guh',         // /g/
  'o': 'oh',          // /ɒ/
  'c': 'kuh',         // /k/
  'k': 'kuh',         // /k/
  'ck': 'k',          // /k/
  'e': 'eh',          // /ɛ/
  'u': 'uh',          // /ʌ/
  'r': 'rrr',         // /r/
  'h': 'huh',         // /h/
  'b': 'buh',         // /b/
  'f': 'fff',         // /f/
  'l': 'lll',         // /l/
  'ff': 'ff',         // /f/
  'll': 'll',         // /l/
  'ss': 'ss',         // /s/
  'j': 'juh',         // /dʒ/
  'v': 'vuh',         // /v/
  'w': 'wuh',         // /w/
  'x': 'ks',          // /ks/
  'y': 'yuh',         // /j/
  'z': 'zzz',         // /z/
  'zz': 'zz',         // /z/
  'qu': 'kw',         // /kw/
  
  // Digraphs
  'sh': 'shhh',       // /ʃ/
  'th': 'th',         // /θ/ or /ð/
  'ch': 'ch',         // /tʃ/
  'ng': 'ng',         // /ŋ/
  'nk': 'nk',         // /ŋk/
  
  // Set 2 sounds (long vowels)
  'ay': 'ay',         // /eɪ/
  'ee': 'ee',         // /iː/
  'igh': 'eye',       // /aɪ/
  'ow': 'oh',         // /əʊ/
  'oo': 'oo',         // /uː/
  'ar': 'ar',         // /ɑː/
  'or': 'or',         // /ɔː/
  'air': 'air',       // /eə/
  'ir': 'er',         // /ɜː/
  'ur': 'er',         // /ɜː/
  'ou': 'ow',         // /aʊ/
  'oy': 'oy',         // /ɔɪ/
  
  // Set 3 sounds
  'ai': 'ay',         // /eɪ/
  'oa': 'oh',         // /əʊ/
  'ew': 'yoo',        // /juː/
  'ie': 'ee',         // /iː/
  'ea': 'ee',         // /iː/
  'aw': 'or',         // /ɔː/
  'are': 'air',       // /eə/
  'er': 'er',         // /ɜː/
  'ow': 'ow',         // /aʊ/ (as in cow)
  'oi': 'oy',         // /ɔɪ/
  'ear': 'eer',       // /ɪə/
  'ure': 'yoor',      // /jʊə/
  'tion': 'shun',     // /ʃən/
  
  // Split digraphs (magic e)
  'a-e': 'ay',        // /eɪ/
  'i-e': 'eye',       // /aɪ/
  'o-e': 'oh',        // /əʊ/
  'u-e': 'yoo',       // /juː/
  
  // Consonant clusters
  'st': 'st',
  'sp': 'sp',
  'nd': 'nd',
  'nt': 'nt',
  'mp': 'mp',
  'lk': 'lk',
  'sk': 'sk',
};

interface PhonemePlayerProps {
  grapheme: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  useElevenLabs?: boolean;
}

export function PhonemePlayer({ 
  grapheme, 
  className = '', 
  size = 'md',
  useElevenLabs = true 
}: PhonemePlayerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasElevenLabs, setHasElevenLabs] = useState(false);

  useEffect(() => {
    // Check if ElevenLabs API key is available
    setHasElevenLabs(!!ELEVENLABS_API_KEY && useElevenLabs);
  }, [useElevenLabs]);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const playWithElevenLabs = async (phonemeText: string): Promise<void> => {
    // Voice ID for a clear UK English voice
    const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah - clear British English
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text: phonemeText,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs error: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl);
        reject(e);
      };
      audio.play().catch(reject);
    });
  };

  const playWithBrowserTTS = (phonemeText: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Browser TTS not supported'));
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(phonemeText);
      
      // Try to get a UK English voice
      const voices = window.speechSynthesis.getVoices();
      const ukVoice = voices.find(v => 
        v.lang === 'en-GB' || 
        v.name.includes('UK') || 
        v.name.includes('British') ||
        v.name.includes('English')
      );
      if (ukVoice) {
        utterance.voice = ukVoice;
      }
      
      utterance.rate = 0.6; // Slower for clarity
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);
      
      window.speechSynthesis.speak(utterance);
    });
  };

  const playPhoneme = useCallback(async () => {
    const normalizedGrapheme = grapheme.toLowerCase().trim();
    const phonemeText = PHONEME_MAP[normalizedGrapheme] || normalizedGrapheme;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (hasElevenLabs) {
        // Try ElevenLabs first
        try {
          await playWithElevenLabs(phonemeText);
          setIsPlaying(true);
          setTimeout(() => setIsPlaying(false), 500);
        } catch (elevenError) {
          console.warn('ElevenLabs failed, falling back to browser TTS:', elevenError);
          // Fall back to browser TTS
          await playWithBrowserTTS(phonemeText);
          setIsPlaying(true);
          setTimeout(() => setIsPlaying(false), 500);
        }
      } else {
        // Use browser TTS only
        await playWithBrowserTTS(phonemeText);
        setIsPlaying(true);
        setTimeout(() => setIsPlaying(false), 500);
      }
    } catch (err) {
      console.error('Failed to play phoneme:', err);
      setError('Failed to play');
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, [grapheme, hasElevenLabs]);

  return (
    <button
      onClick={playPhoneme}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        rounded-full
        flex items-center justify-center
        ${hasElevenLabs 
          ? 'bg-gradient-to-br from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 shadow-lg shadow-pink-200' 
          : 'bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 shadow-lg shadow-blue-200'
        }
        active:scale-95
        transition-all duration-200
        disabled:opacity-70
        ${className}
      `}
      title={`Play "${grapheme}" sound ${hasElevenLabs ? '(ElevenLabs)' : '(Browser TTS)'}`}
      aria-label={`Play sound for grapheme ${grapheme}`}
    >
      {isLoading ? (
        <Loader2 className={`${iconSizes[size]} text-white animate-spin`} />
      ) : (
        <Volume2 className={`${iconSizes[size]} text-white`} />
      )}
    </button>
  );
}

// Hook for ElevenLabs integration with more control
export function useElevenLabs() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    setIsAvailable(!!ELEVENLABS_API_KEY);
  }, []);

  const playPhoneme = useCallback(async (grapheme: string): Promise<void> => {
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ElevenLabs API key not configured');
    }

    const normalizedGrapheme = grapheme.toLowerCase().trim();
    const phonemeText = PHONEME_MAP[normalizedGrapheme] || normalizedGrapheme;

    setIsLoading(true);
    setError(null);

    try {
      const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: phonemeText,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = reject;
        audio.play().catch(reject);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to play sound';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { playPhoneme, isLoading, error, isAvailable };
}

export default PhonemePlayer;
