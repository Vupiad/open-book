import { Minus, Square, X } from 'lucide-react';
import { WindowMinimise, WindowToggleMaximise, Quit } from '../../wailsjs/runtime/runtime';

export default function WindowControls() {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }} className="window-controls">
      <button
        onClick={() => WindowMinimise()}
        className="window-control-btn min-max"
        title="Minimize"
      >
        <Minus size={16} />
      </button>
      <button
        onClick={() => WindowToggleMaximise()}
        className="window-control-btn min-max"
        title="Maximize"
      >
        <Square size={14} />
      </button>
      <button
        onClick={() => Quit()}
        className="window-control-btn close"
        title="Close"
      >
        <X size={16} />
      </button>
    </div>
  );
}
