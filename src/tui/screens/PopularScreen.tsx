import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { popularPackages, popularGlobalTools, popularAgents } from '../../data/popular-packages.js';

interface Props {
  onSelect: (pkg: string) => void;
  onBack: () => void;
}

export function PopularScreen({ onSelect, onBack }: Props): React.ReactElement {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Combine lists for display
  const items = [
    ...popularAgents.map(a => ({ name: a.name, desc: a.desc })),
    ...popularGlobalTools.map(t => ({ name: t.name, desc: t.desc })),
    ...popularPackages.map(p => ({ name: p, desc: '' }))
  ];

  const visibleItems = items.slice(0, 20); // Show only top 20 for now to avoid scrolling issues initially

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(i => Math.max(0, i - 1));
    }
    if (key.downArrow) {
      setSelectedIndex(i => Math.min(visibleItems.length - 1, i + 1));
    }
    if (key.return) {
      onSelect(visibleItems[selectedIndex].name);
    }
    if (input === 'q' || key.escape) {
      onBack();
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">Popular Packages & Tools</Text>
      <Text dimColor>Select a package to scan it</Text>
      <Box flexDirection="column" marginTop={1}>
        {visibleItems.map((item, i) => (
          <Box key={item.name}>
            <Text color={i === selectedIndex ? 'green' : undefined}>
              {i === selectedIndex ? '❯ ' : '  '}
              {item.name}
            </Text>
            {item.desc && (
              <Text dimColor> - {item.desc}</Text>
            )}
          </Box>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Press Enter to scan, q to back</Text>
      </Box>
    </Box>
  );
}
