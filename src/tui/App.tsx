import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { t } from '../i18n/index.js';

type Screen = 'menu' | 'popular' | 'check' | 'settings';

export function App(): React.ReactElement {
  const [screen, setScreen] = useState<Screen>('menu');
  const [selectedIndex, setSelectedIndex] = useState(0);
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
          setScreen(item.key as Screen);
        }
      }
    }

    if (input === 'q') {
      if (screen === 'menu') {
        exit();
      } else {
        setScreen('menu');
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

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">{screen.toUpperCase()}</Text>
      <Text> </Text>
      <Text>Coming soon...</Text>
      <Text dimColor>Press q to go back</Text>
    </Box>
  );
}
