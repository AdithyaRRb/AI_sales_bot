import React from 'react';
import { Settings, Download, Trash2, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SettingsPanelProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  onClearChat: () => void;
  onExportChat: () => void;
  apiOnline: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  selectedModel,
  onModelChange,
  onClearChat,
  onExportChat,
  apiOnline
}) => {
  const models = [
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Fast and efficient' },
    { value: 'gpt-4', label: 'GPT-4', description: 'More capable, slower' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Latest and greatest' }
  ];

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="text-3xl">🚀</div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                AIron Rush
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-slate-600">
                  API Status: {apiOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={selectedModel} onValueChange={onModelChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  <div>
                    <div className="font-medium">{model.label}</div>
                    <div className="text-xs text-slate-500">{model.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={onExportChat}
            disabled={!apiOnline}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onClearChat}
            className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            disabled={!apiOnline}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
};
