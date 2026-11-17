import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Contrast,
  Sun,
  RefreshCw,
  Maximize2,
  X,
  Eye,
  Sliders,
} from 'lucide-react';
import { UploadedDentalImage } from '../types';
import { toPersianDigits } from '../utils/persian';

interface RadiographInspectorProps {
  images: UploadedDentalImage[];
  patientName: string;
  inline?: boolean;
}

export const RadiographInspector: React.FC<RadiographInspectorProps> = ({
  images,
  patientName,
  inline = false,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(105);
  const [contrast, setContrast] = useState(115);
  const [inverted, setInverted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  if (!images || images.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-100 p-8 text-center text-slate-500">
        تصویری برای این پرونده بارگذاری نشده است.
      </div>
    );
  }

  const currentImage = images[selectedIndex] || images[0];

  const resetFilters = () => {
    setZoom(1);
    setRotation(0);
    setBrightness(105);
    setContrast(115);
    setInverted(false);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const filterStyle: React.CSSProperties = {
    filter: `brightness(${brightness}%) contrast(${contrast}%) ${inverted ? 'invert(1)' : ''}`,
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
    transition: isDragging ? 'none' : 'transform 0.2s ease, filter 0.2s ease',
  };

  const categoryBadge = (cat: UploadedDentalImage['category']) => {
    switch (cat) {
      case 'opg':
        return 'گرافی کامل فک (OPG)';
      case 'periapical':
        return 'گرافی تک‌دندان (پری‌اپیکال)';
      default:
        return 'عکس داخل دهانی / دندان';
    }
  };

  const renderViewerContent = (fullscreenMode: boolean) => (
    <div
      className={`flex flex-col rounded-2xl bg-slate-950 text-slate-100 shadow-2xl border border-slate-800 overflow-hidden ${
        fullscreenMode ? 'fixed inset-3 z-50' : ''
      }`}
    >
      {/* Top Diagnostic Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/90 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
            <Eye className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">
                لایت‌باکس تخصصی بررسی گرافی — {patientName}
              </h4>
              <span className="rounded-full bg-teal-500/20 px-2.5 py-0.5 text-xs font-medium text-teal-300 border border-teal-500/30">
                {categoryBadge(currentImage.category)}
              </span>
            </div>
            <p className="text-xs text-slate-400">{currentImage.label}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(4, +(z + 0.35).toFixed(2)))}
            className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 cursor-pointer"
            title="بزرگنمایی"
          >
            <ZoomIn className="h-3.5 w-3.5 text-teal-400" />
            <span>بزرگنمایی</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom((z) => {
                const next = Math.max(0.6, +(z - 0.35).toFixed(2));
                if (next <= 1) setPan({ x: 0, y: 0 });
                return next;
              });
            }}
            className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 cursor-pointer"
            title="کوچک‌نمایی"
          >
            <ZoomOut className="h-3.5 w-3.5 text-teal-400" />
            <span>{toPersianDigits(Math.round(zoom * 100))}٪</span>
          </button>
          <button
            type="button"
            onClick={() => setInverted((v) => !v)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
              inverted
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title="حالت نگاتیو رادیولوژی جهت تشخیص پوسیدگی و ضایعات ریشه"
          >
            <Contrast className="h-3.5 w-3.5" />
            <span>{inverted ? 'نگاتیو فعال' : 'حالت نگاتیو X-Ray'}</span>
          </button>
          <button
            type="button"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 cursor-pointer"
            title="چرخش ۹۰ درجه"
          >
            <RotateCw className="h-3.5 w-3.5 text-sky-400" />
            <span>چرخش</span>
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 cursor-pointer"
            title="بازنشانی تنظیمات تصویر"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>پیش‌فرض</span>
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen((f) => !f)}
            className="flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-teal-500 cursor-pointer"
          >
            {fullscreenMode ? (
              <>
                <X className="h-3.5 w-3.5" />
                <span>بستن تمام‌صفحه</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" />
                <span>بزرگنمایی تمام‌صفحه</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Image Canvas Viewport */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative flex items-center justify-center overflow-hidden bg-black select-none ${
          fullscreenMode ? 'flex-1 min-h-[420px]' : 'h-[340px] sm:h-[400px]'
        } ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
      >
        <img
          src={currentImage.dataUrl}
          alt={currentImage.label}
          style={filterStyle}
          draggable={false}
          className="max-h-full max-w-full object-contain pointer-events-none"
        />

        {zoom > 1 && (
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-slate-900/80 px-3 py-1 text-xs text-teal-300 border border-slate-700">
            برای جابجایی روی گرافی، تصویر را با ماوس بکشید
          </div>
        )}
      </div>

      {/* Brightness & Contrast Sliders + Multi-image Thumbnails */}
      <div className="flex flex-col gap-3 border-t border-slate-800 bg-slate-900/95 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-amber-400" />
            <span className="text-slate-300">روشنایی:</span>
            <input
              type="range"
              min={50}
              max={180}
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="h-1.5 w-24 accent-teal-400 cursor-pointer"
            />
            <span className="w-9 text-slate-400">{toPersianDigits(brightness)}٪</span>
          </div>

          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-sky-400" />
            <span className="text-slate-300">کنتراست ریشه/استخوان:</span>
            <input
              type="range"
              min={60}
              max={220}
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="h-1.5 w-24 accent-sky-400 cursor-pointer"
            />
            <span className="w-9 text-slate-400">{toPersianDigits(contrast)}٪</span>
          </div>
        </div>

        {images.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-400 ml-1">تصاویر ارسالی:</span>
            {images.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => {
                  setSelectedIndex(idx);
                  resetFilters();
                }}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition cursor-pointer ${
                  idx === selectedIndex
                    ? 'border-teal-400 bg-teal-500/20 text-white font-bold'
                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <img
                  src={img.dataUrl}
                  alt={img.label}
                  className="h-6 w-8 rounded object-cover bg-black"
                />
                <span>تصویر {toPersianDigits(idx + 1)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {inline && renderViewerContent(false)}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm">
          {renderViewerContent(true)}
        </div>
      )}
    </>
  );
};
