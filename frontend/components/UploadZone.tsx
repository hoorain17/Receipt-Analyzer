"use client";

import { useCallback, useState } from "react";
import { Upload, Image as ImageIcon, X, Zap } from "lucide-react";
import toast from "react-hot-toast";

interface UploadZoneProps {
  onImageReady: (base64: string, preview: string) => void;
  isLoading: boolean;
  aggressive: boolean;
  onAggressiveChange: (v: boolean) => void;
}

const MAX_FILE_SIZE_MB = 10;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

export default function UploadZone({
  onImageReady,
  isLoading,
  aggressive,
  onAggressiveChange,
}: UploadZoneProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = useCallback(
    (file: File) => {
      if (!ACCEPTED.includes(file.type)) {
        toast.error("Please upload a PNG, JPG, or WebP image.");
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`File too large. Max ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const base64 = dataUrl.split(",")[1];
        setPreview(dataUrl);
        onImageReady(base64, dataUrl);
      };
      reader.readAsDataURL(file);
    },
    [onImageReady]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const clearImage = () => {
    setPreview(null);
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden
          ${dragging
            ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 scale-[1.01]"
            : "border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50"
          }
          ${isLoading ? "opacity-60 pointer-events-none" : "cursor-pointer hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-500/5"}
        `}
      >
        <label className="flex flex-col items-center justify-center p-8 cursor-pointer min-h-[220px]">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
            disabled={isLoading}
          />

          {preview ? (
            <div className="relative w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Receipt preview"
                className="max-h-64 mx-auto rounded-xl object-contain shadow-md"
              />
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); clearImage(); }}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors"
              >
                <X size={14} />
              </button>
              <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-3">
                Click to change image
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg">
                <Upload className="text-white" size={28} />
              </div>
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200 text-lg">
                  Drop your receipt here
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  or <span className="text-brand-500 font-medium">browse files</span>
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ImageIcon size={12} />
                <span>PNG, JPG, WebP up to {MAX_FILE_SIZE_MB}MB</span>
              </div>
            </div>
          )}
        </label>
      </div>

      {/* Settings */}
      <div className="glass rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-amber-500" />
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Aggressive preprocessing
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enhanced contrast &amp; sharpening for low-quality receipts
            </p>
          </div>
        </div>
        <button
          onClick={() => onAggressiveChange(!aggressive)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
            ${aggressive ? "bg-brand-500" : "bg-slate-300 dark:bg-slate-600"}`}
          aria-label="Toggle aggressive preprocessing"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
              ${aggressive ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>
      </div>
    </div>
  );
}
