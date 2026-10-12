import { useCallback, useEffect, useRef, useState } from 'react';
import { PhoneOff, Video } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LanguageContext';

interface VideoCallRoomProps {
  appointmentId: string;
  appointmentTitle: string;
  isOwner: boolean;
  demoMode?: boolean;
  onClose: () => void;
}

interface SignalRow {
  id: string;
  sender_id: string;
  event_type: 'offer' | 'answer' | 'ice-candidate';
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

export function VideoCallRoom({
  appointmentId,
  appointmentTitle,
  isOwner,
  demoMode = false,
  onClose,
}: VideoCallRoomProps) {
  const { user } = useAuth();
  const { t } = useLang();
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const connection = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const channelReady = useRef(false);
  const remoteDescriptionReady = useRef(false);
  const handledSignals = useRef(new Set<string>());
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const autoOfferSent = useRef(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'waiting'>('connecting');
  const [signalingReady, setSignalingReady] = useState(false);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!user) return;

    let disposed = false;
    if (demoMode) {
      navigator.mediaDevices
        .getUserMedia({ audio: true, video: true })
        .then((stream) => {
          if (disposed) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          localStreamRef.current = stream;
          setLocalStream(stream);
        })
        .catch((mediaError: unknown) => {
          if (!disposed) setError(mediaError instanceof Error ? mediaError.message : String(mediaError));
        });

      return () => {
        disposed = true;
        localStreamRef.current?.getTracks().forEach((track) => track.stop());
      };
    }

    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    connection.current = peer;

    const localMediaReady = navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((stream) => {
        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return null;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
        stream.getTracks().forEach((track) => peer.addTrack(track, stream));
        return stream;
      })
      .catch((mediaError: unknown) => {
        if (!disposed) {
          setError(mediaError instanceof Error ? mediaError.message : String(mediaError));
        }
        return null;
      });

    const sendSignal = async (
      eventType: SignalRow['event_type'],
      payload: RTCSessionDescriptionInit | RTCIceCandidateInit
    ) => {
      const { error: insertError } = await supabase.from('video_call_signals').insert({
        appointment_id: appointmentId,
        sender_id: user.id,
        event_type: eventType,
        payload,
      });
      if (insertError && !disposed) setError(insertError.message);
    };

    const flushCandidates = async () => {
      while (pendingCandidates.current.length > 0 && peer.remoteDescription) {
        const candidate = pendingCandidates.current.shift();
        if (candidate) {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (candidateError) {
            if (!disposed) {
              setError(candidateError instanceof Error ? candidateError.message : String(candidateError));
            }
          }
        }
      }
    };

    const processSignal = async (signal: SignalRow) => {
      if (handledSignals.current.has(signal.id) || signal.sender_id === user.id) return;
      handledSignals.current.add(signal.id);

      try {
        if (signal.event_type === 'offer') {
          if (isOwner || peer.signalingState !== 'stable') return;
          const stream = await localMediaReady;
          if (!stream) return;
          await peer.setRemoteDescription(new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit));
          remoteDescriptionReady.current = true;
          await flushCandidates();
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          await sendSignal('answer', answer);
          setStatus('waiting');
          return;
        }

        if (signal.event_type === 'answer') {
          if (!isOwner || peer.signalingState !== 'have-local-offer') return;
          await peer.setRemoteDescription(new RTCSessionDescription(signal.payload as RTCSessionDescriptionInit));
          remoteDescriptionReady.current = true;
          await flushCandidates();
          return;
        }

        const candidate = signal.payload as RTCIceCandidateInit;
        if (remoteDescriptionReady.current) {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          pendingCandidates.current.push(candidate);
        }
      } catch (signalError) {
        if (!disposed) {
          setError(signalError instanceof Error ? signalError.message : String(signalError));
        }
      }
    };

    peer.onicecandidate = (event) => {
      if (event.candidate && channelReady.current) {
        void sendSignal('ice-candidate', event.candidate.toJSON());
      }
    };
    peer.ontrack = (event) => {
      const stream = event.streams[0];
      if (stream) {
        remoteStreamRef.current = stream;
        setRemoteStream(stream);
        setStatus('connected');
      }
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') setStatus('connected');
      if (peer.connectionState === 'failed') {
        setError('Could not connect. Your network may require a TURN relay server.');
      }
    };

    const channel = supabase
      .channel(`video-call-${appointmentId}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'video_call_signals',
          filter: `appointment_id=eq.${appointmentId}`,
        },
        (payload) => {
          void processSignal(payload.new as SignalRow);
        }
      )
      .subscribe((subscriptionStatus) => {
        if (subscriptionStatus === 'SUBSCRIBED') {
          channelReady.current = true;
          setSignalingReady(true);
          setStatus(isOwner ? 'waiting' : 'connecting');
          void (async () => {
            const { data, error: loadError } = await supabase
              .from('video_call_signals')
              .select('id, sender_id, event_type, payload')
              .eq('appointment_id', appointmentId)
              .order('created_at', { ascending: true });
            if (loadError) {
              if (!disposed) setError(loadError.message);
              return;
            }
            for (const signal of (data ?? []) as SignalRow[]) {
              await processSignal(signal);
            }
          })();
        } else if (subscriptionStatus === 'CHANNEL_ERROR' || subscriptionStatus === 'TIMED_OUT') {
          setError(`Video signaling connection failed (${subscriptionStatus}).`);
        }
      });

    return () => {
      disposed = true;
      channelReady.current = false;
      setSignalingReady(false);
      void supabase.removeChannel(channel);
      peer.close();
      connection.current = null;
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [appointmentId, demoMode, isOwner, user]);

  useEffect(() => {
    if (localVideo.current) localVideo.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideo.current) remoteVideo.current.srcObject = remoteStream;
  }, [remoteStream]);

  const startCall = useCallback(async () => {
    const peer = connection.current;
    if (!peer || !channelReady.current) {
      setError('Video is still connecting. Try again in a moment.');
      return;
    }
    setStarting(true);
    setError('');
    try {
      handledSignals.current.clear();
      pendingCandidates.current = [];
      remoteDescriptionReady.current = false;
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      const { error: insertError } = await supabase.from('video_call_signals').insert({
        appointment_id: appointmentId,
        sender_id: user?.id,
        event_type: 'offer',
        payload: offer,
      });
      if (insertError) throw insertError;
      setStatus('waiting');
    } catch (callError) {
      setError(callError instanceof Error ? callError.message : String(callError));
    } finally {
      setStarting(false);
    }
  }, [appointmentId, user]);

  useEffect(() => {
    if (!isOwner || !signalingReady || !localStream || autoOfferSent.current) return;
    autoOfferSent.current = true;
    void startCall();
  }, [isOwner, localStream, signalingReady, startCall]);

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
      style={{ zIndex: 1100, backgroundColor: 'rgba(0,0,0,.72)' }}
      role="dialog"
      aria-modal="true"
      aria-label={t.videoCall}
    >
      <div className="card border-0 shadow-lg w-100" style={{ maxWidth: 1000 }}>
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <div>
            <h5 className="fw-bold mb-0">{t.videoCall}</h5>
            <small className="text-muted">
              {appointmentTitle} · {demoMode ? 'Demo preview — simulated doctor' : status === 'connected' ? t.callConnected : t.callConnecting}
            </small>
          </div>
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={onClose}>
            <PhoneOff size={16} className="me-1" /> {t.callEnd}
          </button>
        </div>

        <div className="card-body">
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="position-relative bg-dark rounded-3 overflow-hidden" style={{ aspectRatio: '16 / 10' }}>
                <video ref={localVideo} autoPlay muted playsInline className="w-100 h-100" style={{ objectFit: 'cover' }} />
                <span className="badge bg-dark position-absolute bottom-0 start-0 m-2">You</span>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="position-relative bg-dark rounded-3 overflow-hidden d-flex align-items-center justify-content-center" style={{ aspectRatio: '16 / 10' }}>
                {demoMode ? (
                  <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-white" style={{ background: 'radial-gradient(circle at 50% 35%, #74c69d, #1b4332 72%)' }}>
                    <div className="rounded-circle bg-white text-success d-flex align-items-center justify-content-center fw-bold mb-2" style={{ width: 88, height: 88, fontSize: 32 }}>A</div>
                    <div className="fw-semibold">{appointmentTitle}</div>
                    <small className="text-white-50">Demo doctor preview</small>
                  </div>
                ) : (
                  <>
                    <video ref={remoteVideo} autoPlay playsInline className="w-100 h-100" style={{ objectFit: 'cover' }} />
                    {!remoteStream && <div className="text-white-50 text-center"><Video size={36} /><div>{t.callConnecting}</div></div>}
                  </>
                )}
                <span className="badge bg-dark position-absolute bottom-0 start-0 m-2">{demoMode ? 'Demo only — no doctor connected' : 'Doctor / patient'}</span>
              </div>
            </div>
          </div>

          {isOwner && !demoMode && error && (
            <div className="text-center mt-3">
              <button
                type="button"
                className="btn btn-outline-success"
                onClick={() => {
                  autoOfferSent.current = true;
                  void startCall();
                }}
                disabled={starting}
              >
                <Video size={17} className="me-1" /> {t.startVideoCall}
              </button>
            </div>
          )}
          {!isOwner && (
            <p className="text-center text-muted small mt-3 mb-0">{t.waitingForPatient}</p>
          )}
        </div>
      </div>
    </div>
  );
}
