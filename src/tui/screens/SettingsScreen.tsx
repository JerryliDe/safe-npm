import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { getConfig, saveConfig, Config } from '../../utils/config.js';

interface Props {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: Props): React.ReactElement {
  const [config, setConfig] = useState<Config>(getConfig());
  const [selectedIndex, setSelectedIndex] = useState(0);

  const settings = [
    {
      key: 'language',
      label: 'Language',
      value: config.language,
      toggle: () => {
        const newLang = config.language === 'en' ? 'zh' : 'en';
        updateConfig({ language: newLang });
      }
    },
    {
      key: 'vt_enabled',
      label: 'VirusTotal Scan',
      value: config.virustotal.enabled ? 'Enabled' : 'Disabled',
      toggle: () => {
        updateConfig({
            virustotal: { ...config.virustotal, enabled: !config.virustotal.enabled }
        });
      }
    },
    {
      key: 'offline',
      label: 'Offline Mode',
      value: config.offline ? 'On' : 'Off',
      toggle: () => {
        updateConfig({ offline: !config.offline });
      }
    }
  ];

  const updateConfig = (newPart: Partial<Config>) => {
    saveConfig(newPart);
    setConfig(getConfig()); // Reload to be sure
  };

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(i => Math.max(0, i - 1));
    }
    if (key.downArrow) {
      setSelectedIndex(i => Math.min(settings.length - 1, i + 1));
    }
    if (key.return || input === ' ') {
        settings[selectedIndex].toggle();
    }
    if (key.escape || input === 'q') {
      onBack();
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">Settings</Text>
      <Box flexDirection="column" marginTop={1}>
        {settings.map((item, i) => (
          <Box key={item.key}>
            <Text color={i === selectedIndex ? 'green' : undefined}>
              {i === selectedIndex ? '❯ ' : '  '}
              {item.label}: <Text bold>{String(item.value)}</Text>
            </Text>
          </Box>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Space/Enter to toggle, q to back</Text>
      </Box>
    </Box>
  );
}
