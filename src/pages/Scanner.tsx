import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle, RefreshCcw, XCircle } from "lucide-react";
import { useCollection } from "@/store/useCollection";
import { scanStickersFromImage } from "@/lib/ai";

const MOTION_SAMPLE_WIDTH = 48;
const MOTION_SAMPLE_HEIGHT = 64;
const MOTION_THRESHOLD = 16;
const STABLE_CAPTURE_MS = 650;

export function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const motionCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastFrameRef = useRef<Uint8ClampedArray | null>(null);
  const stableSinceRef = useRef<number | null>(null);
  const autoCaptureLockedRef = useRef(false);
  const previewRef = useRef("");
  const scanningRef = useRef(false);
  const cameraReadyRef = useRef(false);
  const [preview, setPreview] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState("");

  const { apiKey, markMultiple } = useCollection();

  useEffect(() => {
    startCamera();
    return () => {
      stopMotionDetection();
      stopCamera();
    };
  }, []);

  useEffect(() => {
    previewRef.current = preview;
    if (!preview) {
      autoCaptureLockedRef.current = false;
      stableSinceRef.current = null;
      lastFrameRef.current = null;
    }
  }, [preview]);

  useEffect(() => {
    scanningRef.current = scanning;
  }, [scanning]);

  useEffect(() => {
    cameraReadyRef.current = cameraReady;
  }, [cameraReady]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function startCamera() {
    setCameraError("");
    setCameraReady(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Câmera indisponível neste navegador.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
      startMotionDetection();
    } catch {
      setCameraError("Permita o acesso à câmera para escanear figurinhas.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function startMotionDetection() {
    stopMotionDetection();
    lastFrameRef.current = null;
    stableSinceRef.current = null;

    const tick = (now: number) => {
      detectStableFrame(now);
      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);
  }

  function stopMotionDetection() {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }

  function detectStableFrame(now: number) {
    if (
      !cameraReadyRef.current ||
      previewRef.current ||
      scanningRef.current ||
      autoCaptureLockedRef.current
    ) {
      stableSinceRef.current = null;
      lastFrameRef.current = null;
      return;
    }

    const video = videoRef.current;
    const canvas = motionCanvasRef.current;
    if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return;
    }

    canvas.width = MOTION_SAMPLE_WIDTH;
    canvas.height = MOTION_SAMPLE_HEIGHT;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, MOTION_SAMPLE_WIDTH, MOTION_SAMPLE_HEIGHT);
    const frame = ctx.getImageData(0, 0, MOTION_SAMPLE_WIDTH, MOTION_SAMPLE_HEIGHT).data;
    const lastFrame = lastFrameRef.current;
    lastFrameRef.current = new Uint8ClampedArray(frame);

    if (!lastFrame) return;

    let diff = 0;
    for (let i = 0; i < frame.length; i += 16) {
      diff += Math.abs(frame[i] - lastFrame[i]);
    }

    const averageDiff = diff / (frame.length / 16);
    if (averageDiff < MOTION_THRESHOLD) {
      stableSinceRef.current ??= now;
      if (now - stableSinceRef.current >= STABLE_CAPTURE_MS) {
        autoCaptureLockedRef.current = true;
        void captureAndScan();
      }
    } else {
      stableSinceRef.current = null;
    }
  }

  async function captureAndScan() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !cameraReady || scanning) return;

    if (!apiKey) {
      showToast("Configure sua chave de API em Configurações.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL("image/jpeg", 0.9);
    setPreview(base64);
    previewRef.current = base64;
    autoCaptureLockedRef.current = true;
    setDetected([]);
    setSelected(new Set());
    setScanning(true);

    try {
      const codes = await scanStickersFromImage(apiKey, base64);
      setDetected(codes);
      setSelected(new Set(codes));
    } catch (err) {
      showToast(`Erro: ${err instanceof Error ? err.message : "Falha"}`);
    } finally {
      setScanning(false);
    }
  }

  function confirmCamera() {
    const codes = [...selected];
    if (!codes.length) return;
    markMultiple(codes, "owned");
    showToast(`${codes.length} figurinha(s) marcadas como coletadas!`);
    resetScan();
  }

  function resetScan() {
    setPreview("");
    previewRef.current = "";
    autoCaptureLockedRef.current = false;
    stableSinceRef.current = null;
    lastFrameRef.current = null;
    setDetected([]);
    setSelected(new Set());
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {toast && (
        <div className="toast-safe fixed left-4 right-4 z-50 bg-owned text-white text-sm font-semibold rounded-xl px-4 py-3 text-center shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex-none px-4 pt-5 pb-3">
        <h1 className="text-xl font-bold text-text">Scanner</h1>
      </div>

      <div className="scroll-area flex-1 px-4 pb-4">
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Aponte a câmera para as figurinhas e capture a imagem para a IA ler
            os códigos.
          </p>

          <div className="relative overflow-hidden rounded-2xl border border-border bg-black aspect-[3/4]">
            {preview ? (
              <img
                src={preview}
                alt="Imagem capturada"
                className="h-full w-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="h-full w-full object-cover"
              />
            )}

            {scanning && (
              <div className="absolute inset-0 bg-bg/80 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gold font-medium">Analisando...</p>
              </div>
            )}

            {cameraError && !preview && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center bg-bg">
                <Camera size={40} className="text-muted" strokeWidth={1.2} />
                <p className="text-sm text-muted">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="chip-press bg-surface border border-border text-text text-sm font-semibold rounded-xl px-4 py-2.5"
                >
                  Tentar novamente
                </button>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
          <canvas ref={motionCanvasRef} className="hidden" />

          {!preview ? (
            <div className="space-y-2">
              <p className="text-xs text-muted text-center">
                Segure a câmera parada para capturar automaticamente.
              </p>
              <button
                onClick={captureAndScan}
                disabled={!cameraReady || scanning || Boolean(cameraError)}
                className="chip-press w-full bg-gold text-bg font-semibold text-sm rounded-xl py-3 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Camera size={17} />
                Capturar agora
              </button>
            </div>
          ) : (
            <button
              onClick={resetScan}
              disabled={scanning}
              className="chip-press w-full border border-border text-muted text-sm rounded-xl py-2.5 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <RefreshCcw size={15} />
              Nova captura
            </button>
          )}

          {detected.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-text mb-2">
                {detected.length} figurinha(s) detectadas:
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {detected.map((code) => (
                  <button
                    key={code}
                    onClick={() => {
                      const next = new Set(selected);
                      if (next.has(code)) next.delete(code);
                      else next.add(code);
                      setSelected(next);
                    }}
                    className={`chip-press px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                      selected.has(code)
                        ? "bg-owned/20 border-owned/50 text-owned"
                        : "bg-surface border-border text-muted"
                    }`}
                  >
                    {selected.has(code) ? (
                      <CheckCircle size={11} />
                    ) : (
                      <XCircle size={11} />
                    )}
                    {code}
                  </button>
                ))}
              </div>
              <button
                onClick={confirmCamera}
                disabled={selected.size === 0}
                className="chip-press w-full bg-owned text-white font-semibold text-sm rounded-xl py-3 disabled:opacity-40"
              >
                Confirmar {selected.size} figurinha(s)
              </button>
            </div>
          )}

          {preview && !scanning && detected.length === 0 && (
            <p className="text-sm text-muted text-center py-2">
              Nenhum código detectado. Tente uma captura mais clara.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
