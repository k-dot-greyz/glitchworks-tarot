export function PlaymatZone({
  label,
  isOver,
  size = 'md',
  extraClasses = '',
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  children,
}) {
  const emptySize = size === 'sm' ? 'w-24 h-40' : 'w-64 h-[28rem]';

  return (
    <div
      className={`flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all ${isOver ? 'border-indigo-500 bg-indigo-500/10 scale-105 shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'border-transparent'} ${extraClasses}`}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {label ? (
        <span className="text-[9px] font-mono text-white/40 tracking-widest uppercase border border-white/10 bg-black/50 px-2.5 py-0.5 rounded-full text-center">
          {label}
        </span>
      ) : null}
      {children ?? (
        <div
          className={`rounded-xl border-2 border-dashed border-indigo-500/20 bg-indigo-900/5 flex items-center justify-center text-indigo-400/20 font-mono text-xs text-center ${emptySize}`}
        >
          DROP_HERE
        </div>
      )}
    </div>
  );
}
