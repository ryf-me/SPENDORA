import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ImagePlus, RotateCcw, Upload, X, ZoomIn } from "lucide-react";

const EDITOR_SIZE = 320;
const PREVIEW_SIZE = 112;
const EXPORT_SIZE = 512;

type Offset = {
  x: number;
  y: number;
};

type ProfileImageEditorProps = {
  isOpen: boolean;
  sourceUrl: string | null;
  fileName?: string;
  onCancel: () => void;
  onConfirm: (file: File, previewUrl: string) => void;
};

function clampOffset(offset: Offset, scale: number, image: HTMLImageElement) {
  const width = image.width * scale;
  const height = image.height * scale;

  const minX = EDITOR_SIZE - width;
  const minY = EDITOR_SIZE - height;

  return {
    x: Math.min(0, Math.max(minX, offset.x)),
    y: Math.min(0, Math.max(minY, offset.y)),
  };
}

function drawEditorCanvas(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  scale: number,
  offset: Offset,
) {
  const context = canvas.getContext("2d");
  if (!context) return;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, offset.x, offset.y, image.width * scale, image.height * scale);

  context.save();
  context.fillStyle = "rgba(15, 23, 42, 0.62)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = "destination-out";
  context.beginPath();
  context.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 20, 0, Math.PI * 2);
  context.fill();
  context.restore();

  context.beginPath();
  context.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 20, 0, Math.PI * 2);
  context.strokeStyle = "rgba(255,255,255,0.88)";
  context.lineWidth = 3;
  context.stroke();
}

function exportAvatarBlob(
  image: HTMLImageElement,
  scale: number,
  offset: Offset,
  type: string,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = EXPORT_SIZE;
    canvas.height = EXPORT_SIZE;

    const context = canvas.getContext("2d");
    if (!context) {
      reject(new Error("Failed to initialize the image editor."));
      return;
    }

    const factor = EXPORT_SIZE / EDITOR_SIZE;
    context.drawImage(
      image,
      offset.x * factor,
      offset.y * factor,
      image.width * scale * factor,
      image.height * scale * factor,
    );

    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to prepare the cropped profile photo."));
        return;
      }
      resolve(blob);
    }, type, type === "image/jpeg" ? 0.92 : undefined);
  });
}

export default function ProfileImageEditor({
  isOpen,
  sourceUrl,
  fileName,
  onCancel,
  onConfirm,
}: ProfileImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragStateRef = useRef<{ pointerId: number; startX: number; startY: number; offset: Offset } | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const modalRoot = typeof document !== "undefined" ? document.body : null;

  useEffect(() => {
    if (!isOpen || !sourceUrl) {
      setImage(null);
      setScale(1);
      setMinScale(1);
      setOffset({ x: 0, y: 0 });
      setProcessing(false);
      setErrorMessage("");
      return;
    }

    let cancelled = false;
    const nextImage = new Image();
    nextImage.onload = () => {
      if (cancelled) return;

      const fittedScale = Math.max(EDITOR_SIZE / nextImage.width, EDITOR_SIZE / nextImage.height);
      setImage(nextImage);
      setScale(fittedScale);
      setMinScale(fittedScale);
      setOffset({
        x: (EDITOR_SIZE - nextImage.width * fittedScale) / 2,
        y: (EDITOR_SIZE - nextImage.height * fittedScale) / 2,
      });
      setErrorMessage("");
    };
    nextImage.onerror = () => {
      if (!cancelled) {
        setErrorMessage("We could not open that image. Please try another file.");
      }
    };
    nextImage.src = sourceUrl;

    return () => {
      cancelled = true;
    };
  }, [isOpen, sourceUrl]);

  useEffect(() => {
    if (!canvasRef.current || !image) return;
    drawEditorCanvas(canvasRef.current, image, scale, offset);
  }, [image, offset, scale]);

  const previewStyle = useMemo(() => {
    if (!image) {
      return {
        background:
          "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.16), rgba(15,23,42,0.7))",
      };
    }

    const factor = PREVIEW_SIZE / EDITOR_SIZE;
    return {
      backgroundImage: `url("${sourceUrl}")`,
      backgroundSize: `${image.width * scale * factor}px ${image.height * scale * factor}px`,
      backgroundPosition: `${offset.x * factor}px ${offset.y * factor}px`,
      backgroundRepeat: "no-repeat",
      backgroundColor: "var(--bg-elevated)",
    } as React.CSSProperties;
  }, [image, offset.x, offset.y, scale, sourceUrl]);

  const handleScaleChange = (nextScale: number) => {
    if (!image) return;

    const centerX = EDITOR_SIZE / 2;
    const centerY = EDITOR_SIZE / 2;
    const imageXAtCenter = (centerX - offset.x) / scale;
    const imageYAtCenter = (centerY - offset.y) / scale;
    const nextOffset = clampOffset(
      {
        x: centerX - imageXAtCenter * nextScale,
        y: centerY - imageYAtCenter * nextScale,
      },
      nextScale,
      image,
    );

    setScale(nextScale);
    setOffset(nextOffset);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!image) return;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offset,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!image || !dragStateRef.current || dragStateRef.current.pointerId !== event.pointerId) return;

    const nextOffset = clampOffset(
      {
        x: dragStateRef.current.offset.x + (event.clientX - dragStateRef.current.startX),
        y: dragStateRef.current.offset.y + (event.clientY - dragStateRef.current.startY),
      },
      scale,
      image,
    );

    setOffset(nextOffset);
  };

  const clearDragState = (event?: React.PointerEvent<HTMLCanvasElement>) => {
    if (event && dragStateRef.current && dragStateRef.current.pointerId === event.pointerId) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // no-op if the browser already released capture
      }
    }
    dragStateRef.current = null;
  };

  const handleReset = () => {
    if (!image) return;

    setScale(minScale);
    setOffset({
      x: (EDITOR_SIZE - image.width * minScale) / 2,
      y: (EDITOR_SIZE - image.height * minScale) / 2,
    });
  };

  const handleConfirm = async () => {
    if (!image || !sourceUrl) return;

    setProcessing(true);
    setErrorMessage("");

    try {
      const exportType = fileName?.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
      const blob = await exportAvatarBlob(image, scale, offset, exportType);
      const extension = exportType === "image/png" ? "png" : "jpg";
      const avatarFile = new File([blob], `profile-avatar-${Date.now()}.${extension}`, { type: exportType });
      const previewUrl = URL.createObjectURL(blob);
      onConfirm(avatarFile, previewUrl);
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to prepare your profile photo.");
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen || !modalRoot) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-4xl rounded-[28px] border shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--text-muted)" }}>
              Profile Photo
            </p>
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Adjust your avatar
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:p-6">
          <div className="space-y-4">
            <div
              className="overflow-hidden rounded-[28px] border"
              style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
            >
              <canvas
                ref={canvasRef}
                width={EDITOR_SIZE}
                height={EDITOR_SIZE}
                className="w-full max-w-[520px] touch-none cursor-grab active:cursor-grabbing"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={clearDragState}
                onPointerCancel={clearDragState}
                onPointerLeave={clearDragState}
              />
            </div>

            <div className="space-y-3 rounded-2xl border px-4 py-4" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ZoomIn size={16} style={{ color: "var(--accent)" }} />
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    Zoom
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold"
                  style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
              </div>

              <input
                type="range"
                min={minScale}
                max={Math.max(minScale * 3.2, minScale + 1)}
                step={0.01}
                value={scale}
                onChange={(event) => handleScaleChange(Number(event.target.value))}
                className="w-full accent-[var(--accent)]"
              />

              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Drag the image to reposition it inside the circle. The saved avatar is exported as a square image for
                consistent display across the app.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border px-4 py-4" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>
                Live Preview
              </p>
              <div className="mt-4 flex justify-center">
                <div
                  className="h-28 w-28 rounded-full border-4 shadow-xl"
                  style={{ ...previewStyle, borderColor: "var(--accent)" }}
                />
              </div>
              <div className="mt-4 rounded-xl border px-3 py-3 text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                <div className="flex items-center gap-2">
                  <ImagePlus size={14} />
                  <span>{fileName || "Selected image"}</span>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {errorMessage}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={processing || !image}
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
                style={{ background: "var(--accent)" }}
              >
                <Upload size={16} />
                {processing ? "Preparing image..." : "Use this photo"}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-2xl border px-4 py-3 text-sm font-semibold"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    modalRoot,
  );
}
