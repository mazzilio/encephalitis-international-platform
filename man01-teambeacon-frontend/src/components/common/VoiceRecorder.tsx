/**
 * Voice Recorder Component
 * Allows users to record voice messages (up to 2 minutes), transcribe them, and edit before submission
 */

/// <reference types="node" />

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  LinearProgress,
  Stack,
  IconButton,
  Chip,
  TextField,
  CircularProgress,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import EditIcon from '@mui/icons-material/Edit';

interface VoiceRecorderProps {
  onSubmit: (transcribedText: string) => Promise<void>;
  maxDurationSeconds?: number;
}

export default function VoiceRecorder({ 
  onSubmit, 
  maxDurationSeconds = 120 // 2 minutes default
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [wordCount, setWordCount] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      audioChunksRef.current = [];
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      
      streamRef.current = stream;

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          
          // Auto-stop at max duration
          if (newTime >= maxDurationSeconds) {
            stopRecording();
            return maxDurationSeconds;
          }
          
          return newTime;
        });
      }, 1000);

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Unable to access microphone. Please check your browser permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    setTranscribedText('');
    setWordCount(0);
    setError(null);
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;
    
    try {
      setIsTranscribing(true);
      setError(null);

      // Convert audio blob to base64
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove the data:audio/webm;base64, prefix
          const base64Data = base64String.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      // Send directly to transcription endpoint
      const transcribeUrl = 'https://e596qxoav7.execute-api.us-west-2.amazonaws.com/dev/transcribe';
      
      const response = await fetch(transcribeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioData: base64Audio,
          sourceLanguage: 'auto',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Transcription failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.transcribedText) {
        setTranscribedText(data.transcribedText);
        setWordCount(data.wordCount || 0);
      } else {
        throw new Error('No transcription received from server');
      }
    } catch (err) {
      console.error('Error transcribing audio:', err);
      setError('Failed to transcribe audio. Please try again or type your message instead.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSubmit = async () => {
    if (!transcribedText.trim()) {
      setError('Please provide some text before submitting');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(transcribedText);
      
      // Reset after successful submission
      deleteRecording();
    } catch (err) {
      console.error('Error submitting transcription:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercentage = (recordingTime / maxDurationSeconds) * 100;

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 3, 
        borderRadius: 3,
        border: 2,
        borderColor: isRecording ? 'error.main' : 'divider',
        transition: 'all 0.3s ease',
      }}
    >
      <Stack spacing={2}>
        {/* Header */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Voice Recording Option
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tell us about your situation in your own words (max {Math.floor(maxDurationSeconds / 60)} minutes)
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Recording Status */}
        {isRecording && (
          <Box sx={{ textAlign: 'center' }}>
            <Chip
              icon={<FiberManualRecordIcon sx={{ animation: 'pulse 1.5s infinite' }} />}
              label="Recording..."
              color="error"
              sx={{
                fontWeight: 600,
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                },
              }}
            />
          </Box>
        )}

        {/* Timer and Progress */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {formatTime(recordingTime)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatTime(maxDurationSeconds)}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progressPercentage}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: isRecording ? 'error.main' : 'success.main',
              },
            }}
          />
        </Box>

        {/* Audio Playback */}
        {audioBlob && !isRecording && !transcribedText && (
          <Box sx={{ textAlign: 'center' }}>
            <audio 
              controls 
              src={URL.createObjectURL(audioBlob)}
              style={{ width: '100%', maxWidth: '400px' }}
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Duration: {formatTime(recordingTime)}
            </Typography>
          </Box>
        )}

        {/* Transcribing Status */}
        {isTranscribing && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Transcribing your audio...
            </Typography>
          </Box>
        )}

        {/* Transcribed Text Editor */}
        {transcribedText && !isTranscribing && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                <EditIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'middle' }} />
                Review and Edit Your Message
              </Typography>
              <Chip 
                label={`${wordCount} words`} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            </Box>
            <TextField
              multiline
              rows={8}
              fullWidth
              value={transcribedText}
              onChange={(e) => {
                setTranscribedText(e.target.value);
                setWordCount(e.target.value.trim().split(/\s+/).filter(Boolean).length);
              }}
              placeholder="Your transcribed message will appear here. You can edit it before submitting."
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Please review the transcription for accuracy and make any necessary edits before submitting.
            </Typography>
          </Box>
        )}

        {/* Control Buttons */}
        <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
          {!isRecording && !audioBlob && !transcribedText && (
            <Button
              variant="contained"
              color="error"
              size="large"
              startIcon={<MicIcon />}
              onClick={startRecording}
              sx={{
                minWidth: 200,
                py: 1.5,
                fontWeight: 600,
              }}
            >
              Start Recording
            </Button>
          )}

          {isRecording && (
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<StopIcon />}
              onClick={stopRecording}
              sx={{
                minWidth: 200,
                py: 1.5,
                fontWeight: 600,
              }}
            >
              Stop Recording
            </Button>
          )}

          {audioBlob && !isRecording && !transcribedText && !isTranscribing && (
            <>
              <IconButton
                color="error"
                onClick={deleteRecording}
                sx={{
                  border: 1,
                  borderColor: 'error.main',
                }}
              >
                <DeleteIcon />
              </IconButton>

              <Button
                variant="outlined"
                color="primary"
                size="large"
                startIcon={<MicIcon />}
                onClick={startRecording}
              >
                Re-record
              </Button>

              <Button
                variant="contained"
                color="primary"
                size="large"
                endIcon={<SendIcon />}
                onClick={transcribeAudio}
                sx={{
                  minWidth: 150,
                  fontWeight: 600,
                }}
              >
                Transcribe
              </Button>
            </>
          )}

          {transcribedText && !isTranscribing && (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={deleteRecording}
                disabled={isSubmitting}
              >
                Start Over
              </Button>

              <Button
                variant="contained"
                color="success"
                size="large"
                endIcon={<SendIcon />}
                onClick={handleSubmit}
                disabled={isSubmitting || !transcribedText.trim()}
                sx={{
                  minWidth: 150,
                  fontWeight: 600,
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </>
          )}
        </Stack>

        {/* Helper Text */}
        {!transcribedText && (
          <Alert severity="info" icon={<MicIcon />}>
            <Typography variant="body2">
              <strong>Tips for better results:</strong>
              <br />
              • Speak clearly in a quiet environment
              <br />
              • Mention your role (patient, caregiver, or professional)
              <br />
              • Describe your situation and what help you need
              <br />
              • Share any specific concerns or questions
            </Typography>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
