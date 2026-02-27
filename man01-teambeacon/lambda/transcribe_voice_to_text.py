import json
import base64
import boto3
import os
import time
import urllib.request
from datetime import datetime

# Initialize AWS clients
transcribe = boto3.client('transcribe')
s3 = boto3.client('s3')

# Environment variables
S3_BUCKET = os.environ.get('S3_BUCKET_NAME')

def lambda_handler(event, context):
    """
    AWS Lambda function to handle audio transcription
    """
    print("🎤 [TRANSCRIBE] Handler invoked")
    
    try:
        # Parse request
        if isinstance(event, str):
            body = json.loads(event)
        elif 'body' in event:
            body = json.loads(event['body'])
        else:
            body = event
        
        audio_data_base64 = body.get('audioData')
        source_language = body.get('sourceLanguage', 'auto')
        timestamp = body.get('timestamp', datetime.utcnow().isoformat())
        mime_type = body.get('mimeType', 'audio/webm')  # Default to WebM (browser format)
        
        if not audio_data_base64:
            return create_response(400, {'error': 'Missing audioData'})
        
        if not S3_BUCKET:
            return create_response(500, {'error': 'S3_BUCKET_NAME not set'})
        
        # Determine file format from mime type
        format_map = {
            'audio/webm': ('webm', 'webm'),
            'audio/webm;codecs=opus': ('webm', 'webm'),
            'audio/wav': ('wav', 'wav'),
            'audio/mp3': ('mp3', 'mp3'),
            'audio/mp4': ('mp4', 'mp4'),
            'audio/mpeg': ('mp3', 'mp3'),
            'audio/ogg': ('ogg', 'ogg')
        }
        
        # Get file extension and media format for Transcribe
        file_ext, media_format = format_map.get(mime_type, ('webm', 'webm'))
        
        # Decode and upload
        audio_data = base64.b64decode(audio_data_base64)
        file_key = f"audio-recordings/{timestamp.replace(':', '-')}.{file_ext}"
        
        s3.put_object(Bucket=S3_BUCKET, Key=file_key, Body=audio_data, ContentType=mime_type)
        s3_uri = f"s3://{S3_BUCKET}/{file_key}"
        
        print(f"📤 Uploaded audio to S3: {s3_uri} (format: {media_format}, mime: {mime_type})")
        
        # Start transcription
        job_name = f"transcription-{timestamp.replace(':', '-')}"
        
        if source_language == 'auto':
            transcribe.start_transcription_job(
                TranscriptionJobName=job_name,
                Media={'MediaFileUri': s3_uri},
                MediaFormat=media_format,
                IdentifyLanguage=True
            )
        else:
            transcribe.start_transcription_job(
                TranscriptionJobName=job_name,
                Media={'MediaFileUri': s3_uri},
                MediaFormat=media_format,
                LanguageCode=convert_to_transcribe_language(source_language)
            )
        
        # Wait for completion
        max_wait = 60
        wait_time = 0
        transcribed_text = ""
        detected_language = source_language
        confidence = None
        
        while wait_time < max_wait:
            job_status = transcribe.get_transcription_job(TranscriptionJobName=job_name)
            status = job_status['TranscriptionJob']['TranscriptionJobStatus']
            
            if status == 'COMPLETED':
                transcript_uri = job_status['TranscriptionJob']['Transcript']['TranscriptFileUri']
                with urllib.request.urlopen(transcript_uri) as response:
                    transcript_data = json.loads(response.read().decode())
                
                transcribed_text = transcript_data['results']['transcripts'][0]['transcript']
                
                if transcript_data['results'].get('items'):
                    confidences = [
                        float(item.get('alternatives', [{}])[0].get('confidence', 0))
                        for item in transcript_data['results']['items']
                        if item.get('alternatives', [{}])[0].get('confidence')
                    ]
                    if confidences:
                        confidence = sum(confidences) / len(confidences)
                
                if source_language == 'auto':
                    detected_language = job_status['TranscriptionJob'].get('LanguageCode', 'en-US').split('-')[0]
                
                break
            elif status == 'FAILED':
                return create_response(500, {
                    'error': 'Transcription failed',
                    'details': job_status['TranscriptionJob'].get('FailureReason', 'Unknown')
                })
            
            time.sleep(2)
            wait_time += 2
        else:
            return create_response(408, {'error': 'Transcription timeout'})
        
        # Cleanup
        try:
            transcribe.delete_transcription_job(TranscriptionJobName=job_name)
        except:
            pass
        
        return create_response(200, {
            'transcribedText': transcribed_text,
            'wordCount': len(transcribed_text.split()) if transcribed_text else 0
        })
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return create_response(500, {'error': str(e)})


def convert_to_transcribe_language(lang_code):
    language_map = {
        'en': 'en-US', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE',
        'it': 'it-IT', 'pt': 'pt-BR', 'zh': 'zh-CN', 'ja': 'ja-JP',
        'ko': 'ko-KR', 'ar': 'ar-SA', 'ru': 'ru-RU', 'hi': 'hi-IN',
        'nl': 'nl-NL', 'tr': 'tr-TR'
    }
    return language_map.get(lang_code, 'en-US')


def create_response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        'body': json.dumps(body)
    }
