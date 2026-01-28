import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { t } from '../i18n/index.js';
import { PopularScreen } from './screens/PopularScreen.js';
import { CheckScreen } from './screens/CheckScreen.js';
import { SettingsScreen } from './screens/SettingsScreen.js';

type Screen = 'menu' | 'popular' | 'check' | 'settings';

export function App(): React.ReactElement {
  const [screen, setScreen] = useState<Screen>('menu');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [checkPackage, setCheckPackage] = useState<string | undefined>(undefined);
  const { exit } = useApp();

  const menuItems = [
    { key: 'popular', label: t('tuiPopular') },
    { key: 'check', label: t('tuiCheck') },
    { key: 'settings', label: t('tuiSettings') },
    { key: 'quit', label: t('tuiQuit') },
  ];

  useInput((input, key) => {
    if (screen === 'menu') {
      if (key.upArrow) {
        setSelectedIndex((i) => (i > 0 ? i - 1 : menuItems.length - 1));
      }
      if (key.downArrow) {
        setSelectedIndex((i) => (i < menuItems.length - 1 ? i + 1 : 0));
      }
      if (key.return) {
        const item = menuItems[selectedIndex];
        if (item.key === 'quit') {
          exit();
        } else {
          setCheckPackage(undefined); // Reset check package when entering normally
          setScreen(item.key as Screen);
        }
      }
      if (input === 'q') {
        exit();
      }
    }
  });

  if (screen === 'menu') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="cyan">{t('tuiWelcome')}</Text>
        <Text> </Text>
        {menuItems.map((item, i) => (
          <Text key={item.key} color={i === selectedIndex ? 'green' : undefined}>
            {i === selectedIndex ? '❯ ' : '  '}{item.label}
          </Text>
        ))}
        <Text> </Text>
        <Text dimColor>Use ↑↓ to navigate, Enter to select, q to quit</Text>
      </Box>
    );
  }

  if (screen === 'popular') {
    return (
      <Box padding={1}>
        <PopularScreen
          onSelect={(pkg) => {
            setCheckPackage(pkg);
            setScreen('check');
          }}
          onBack={() => setScreen('menu')}
        />
      </Box>
    );
  }

  if (screen === 'check') {
    return (
      <Box padding={1}>
        <CheckScreen
          initialPackage={checkPackage}
          onBack={() => setScreen('menu')}
        />
      </Box>
    );
  }

  if (screen === 'settings') {
    return (
      <Box padding={1}>
        <SettingsScreen onBack={() => setScreen('menu')} />
      </Box>
    );
  }

  return <Text>Error: Unknown screen</Text>;
}
