import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { scanPackage, ScanResult } from '../../scanner/index.js';
import { t } from '../../i18n/index.js';

interface Props {
  initialPackage?: string;
  onBack: () => void;
}

export function CheckScreen({ initialPackage, onBack }: Props): React.ReactElement {
  const [query, setQuery] = useState(initialPackage || '');
  const [loading, setLoading] = useState(!!initialPackage);
  const [progressMsg, setProgressMsg] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useInput((input, key) => {
    if (loading) return;

    if (key.escape) {
      onBack();
      return;
    }

    if (key.return) {
      if (query.trim()) {
        startScan(query);
      }
      return;
    }
  });

  useEffect(() => {
    if (initialPackage) {
      startScan(initialPackage);
    }
  }, []);

  const startScan = async (pkg: string) => {
    setLoading(true);
    setProgressMsg('Initializing scan...');
    setError(null);
    setResult(null);
    try {
      const res = await scanPackage(pkg, {}, (msg, completed, total) => {
          setProgressMsg(`${msg} (${completed}/${total})`);
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'fatal': return 'red';
      case 'high': return 'red';
      case 'warning': return 'yellow';
      case 'safe': return 'green';
      default: return 'white';
    }
  };

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">{t('tuiCheck')}</Text>

      <Box marginTop={1}>
        <Text>Package: </Text>
        <TextInput
            value={query}
            onChange={setQuery}
            onSubmit={() => {
                if (query.trim()) startScan(query);
            }}
        />
        <Text dimColor>{loading ? ` ${progressMsg}` : ''}</Text>
      </Box>

      {error && (
        <Box marginTop={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}

      {result && (
        <Box flexDirection="column" marginTop={1} borderStyle="single" borderColor={getRiskColor(result.riskLevel)} padding={1}>
          <Box>
             <Text bold>Risk Level: </Text>
             <Text color={getRiskColor(result.riskLevel)} bold>{result.riskLevel.toUpperCase()}</Text>
          </Box>

          <Box flexDirection="column" marginTop={1}>
            {result.checks.map((check, i) => (
                <Box key={i}>
                     <Text color={check.status === 'pass' ? 'green' : check.status === 'fail' ? 'red' : 'gray'}>
                        {check.status === 'pass' ? '✓ ' : check.status === 'fail' ? '✗ ' : '○ '}
                     </Text>
                     <Text>{check.name}: </Text>
                     <Text dimColor>{check.description}</Text>
                </Box>
            ))}
          </Box>

          <Box flexDirection="column" marginTop={1}>
            {result.issues.length === 0 ? (
                <Text color="green">No issues found. Package appears safe.</Text>
            ) : (
                result.issues.map((issue, i) => (
                    <Box key={i} flexDirection="column" marginBottom={1}>
                        <Text color={issue.severity === 'high' || issue.severity === 'fatal' ? 'red' : 'yellow'}>
                            ⚠ {issue.message}
                        </Text>
                        {issue.details && <Text dimColor>  {issue.details}</Text>}
                    </Box>
                ))
            )}
          </Box>

          {!result.canBypass && (
              <Box marginTop={1}>
                  <Text color="red" bold>BLOCK: Package installation blocked by policy.</Text>
              </Box>
          )}
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>Enter to scan, Esc to back</Text>
      </Box>
    </Box>
  );
}
