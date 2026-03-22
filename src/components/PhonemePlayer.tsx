import { useState, useCallback } from 'react';
import { Volume2, Loader2 } from 'lucide-react';

// Phoneme to pronunciation mapping for ElevenLabs
// Using phonetic approximations that produce correct sounds
const PHONEME_MAP: Record<string, string> = {
  // Single letters - phoneme sounds (not letter names)
  's': 'ssssss',      // /s/ not /ɛs/
  'a': 'aaaah',       // /æ/ not /eɪ/
  't': 'ttttt',       // /t/ not /tiː/
  'p': 'ppppp',       // /p/ not /piː/
  'i': 'iiiii',       // /ɪ/ not /aɪ/
  'n': 'nnnnn',       // /n/ not /ɛn/
  'm': 'mmmmm',       // /m/ not /ɛm/
  'd': 'ddddd',       // /d/ not /diː/
  'g': 'ggggg',       // /g/ not /dʒiː/
  'o': 'ooooo',       // /ɒ/ not /oʊ/
  'c': 'kkkkk',       // /k/ not /siː/
  'k': 'kkkkk',       // /k/ not /keɪ/
  'ck': 'kkkkk',      // /k/
  'e': 'eeeee',       // /ɛ/ not /iː/
  'u': 'uuuuu',       // /ʌ/ not /juː/
  'r': 'rrrrr',       // /r/ not /ɑːr/
  'h': 'hhhhh',       // /h/ not /eɪtʃ/
  'b': 'bbbbb',       // /b/ not /biː/
  'f': 'fffff',       // /f/ not /ɛf/
  'l': 'lllll',       // /l/ not /ɛl/
  'ff': 'fffff',      // /f/
  'll': 'lllll',      // /l/
  'ss': 'ssssss',     // /s/
  'j': 'jjjjj',       // /dʒ/ not /dʒeɪ/
  'v': 'vvvvv',       // /v/ not /viː/
  'w': 'wwwww',       // /w/ not /ˈdʌbəl.juː/
  'x': 'kkk-sssss',   // /ks/ not /ɛks/
  'y': 'yyyyy',       // /j/ not /waɪ/
  'z': 'zzzzz',       // /z/ not /ziː/
  'zz': 'zzzzz',      // /z/
  'qu': 'kwkwkw',     // /kw/
  
  // Digraphs
  'sh': 'shshsh',     // /ʃ/
  'th': 'ththth',     // /θ/ or /ð/ (voiceless shown)
  'ch': 'chchch',     // /tʃ/
  'ng': 'ngngng',     // /ŋ/
  'nk': 'ng-k-k-k',   // /ŋk/
  
  // Set 2 sounds (long vowels)
  'ay': 'ayyyyy',     // /eɪ/
  'ee': 'eeeeee',     // /iː/
  'igh': 'iiiiii',    // /aɪ/
  'ow': 'owwwww',     // /əʊ/
  'oo': 'oooooo',     // /uː/
  'ar': 'arrrrr',     // /ɑː/
  'or': 'orrrrr',     // /ɔː/
  'air': 'airrrr',    // /eə/
  'ir': 'irrrrr',     // /ɜː/
  'ur': 'urrrrr',     // /ɜː/
  'ou': 'ouuuuu',     // /aʊ/
  'oy': 'oyyyyy',     // /ɔɪ/
  
  // Set 3 sounds
  'ai': 'ayyyyy',     // /eɪ/
  'oa': 'oahhhh',     // /əʊ/
  'ew': 'yooooo',     // /juː/
  'ie': 'eeeee',      // /iː/
  'ea': 'eeeeee',     // /iː/
  'aw': 'awwwww',     // /ɔː/
  'are': 'areeee',    // /eə/
  'er': 'urrrrr',     // /ɜː/
  'ur': 'urrrrr',     // /ɜː/
  'ow': 'owwwww',     // /aʊ/ (as in cow)
  'oi': 'oyyyyy',     // /ɔɪ/
  'ear': 'earrrr',    // /ɪə/
  'ure': 'yoorrrr',   // /jʊə/
  'tion': 'shunnnn',  // /ʃən/
  
  // Split digraphs (magic e)
  'a-e': 'ayyyyy',    // /eɪ/
  'i-e': 'iiiiii',    // /aɪ/
  'o-e': 'ohhhhh',    // /əʊ/
  'u-e': 'yooooo',    // /juː/
  
  // Consonant clusters (blend the sounds)
  'st': 'ssss-tttt',
  'sp': 'ssss-pppp',
  'nd': 'nnnn-dddd',
  'nt': 'nnnn-tttt',
  'mp': 'mmmm-pppp',
  'lk': 'llll-kkkk',
  'sk': 'ssss-kkkk',
};

interface PhonemePlayerProps {
  grapheme: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PhonemePlayer({ grapheme, className = '', size = 'md' }: PhonemePlayerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const playPhoneme = useCallback(async () => {
    const normalizedGrapheme = grapheme.toLowerCase().trim();
    const phonemeText = PHONEME_MAP[normalizedGrapheme] || normalizedGrapheme;
    
    // Use browser's built-in TTS as fallback/primary
    // For ElevenLabs integration, you would call your API here
    if ('speechSynthesis' in window) {
      setIsLoading(true);
      setError(null);
      
      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(phonemeText);
        
        // Try to get a UK English voice
        const voices = window.speechSynthesis.getVoices();
        const ukVoice = voices.find(v => v.lang === 'en-GB' || v.name.includes('UK') || v.name.includes('British'));
        if (ukVoice) {
          utterance.voice = ukVoice;
        }
        
        utterance.rate = 0.7; // Slower for clarity
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onstart = () => {
          setIsLoading(false);
          setIsPlaying(true);
        };
        
        utterance.onend = () => {
          setIsPlaying(false);
        };
        
        utterance.onerror = () => {
          setIsLoading(false);
          setIsPlaying(false);
          setError('Failed to play');
        };
        
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        setIsLoading(false);
        setError('Failed to play');
      }
    } else {
      setError('Audio not supported');
    }
  }, [grapheme]);

  return (
    <button
      onClick={playPhoneme}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        rounded-full
        flex items-center justify-center
        bg-gradient-to-br from-pink-400 to-pink-600
        hover:from-pink-500 hover:to-pink-700
        active:scale-95
        transition-all duration-200
        shadow-lg shadow-pink-200
        disabled:opacity-70
        ${className}
      `}
      title={`Play sound for "${grapheme}"`}
    >
      {isLoading ? (
        <Loader2 className={`${iconSizes[size]} text-white animate-spin`} />
      ) : (
        <Volume2 className={`${iconSizes[size]} text-white`} />
      )}
    </button>
  );
}

// ElevenLabs API integration (for when you have API key)
export async function playPhonemeWithElevenLabs(
  grapheme: string, 
  apiKey: string
): Promise<void> {
  const normalizedGrapheme = grapheme.toLowerCase().trim();
  const phonemeText = PHONEME_MAP[normalizedGrapheme] || normalizedGrapheme;
  
  // Voice ID for a clear UK English voice
  // You can change this to any ElevenLabs voice
  const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah - clear British English
  
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
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
    throw new Error('Failed to generate speech');
  }

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  
  return new Promise((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      resolve();
    };
    audio.onerror = reject;
    audio.play();
  });
}

// Hook for ElevenLabs integration
export function useElevenLabs(apiKey?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const playPhoneme = useCallback(async (grapheme: string) => {
    if (!apiKey) {
      // Fall back to browser TTS
      const normalizedGrapheme = grapheme.toLowerCase().trim();
      const phonemeText = PHONEME_MAP[normalizedGrapheme] || normalizedGrapheme;
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(phonemeText);
        utterance.rate = 0.7;
        window.speechSynthesis.speak(utterance);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await playPhonemeWithElevenLabs(grapheme, apiKey);
    } catch (err) {
      setError('Failed to play sound');
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  return { playPhoneme, isLoading, error };
}

export default PhonemePlayer;
