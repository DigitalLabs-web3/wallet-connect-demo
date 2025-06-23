/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import '@walletconnect/react-native-compat';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  Text,
  Linking,
} from 'react-native';
import { Core } from '@walletconnect/core';
import { WalletKit } from '@reown/walletkit';
import { useEffect, useState } from 'react';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  const [walletKit, setWalletKit] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      initWalletConnect();
      setIsInitialized(true);
    }

    // 添加深度链接监听
    const handleDeepLink = async (event: { url: string }) => {
      console.log('Deep link received:', event.url);

      // Handle basic URL scheme check
      if (event.url === 'onegate://') {
        console.log('Basic URL scheme check successful');
        return;
      }

      if (event.url.startsWith('onegate://')) {
        try {
          // Extract and validate the URI
          let uri = event.url.replace('onegate://wc?uri=', '');
          console.log('Raw URI after extraction:', uri);

          // If the URI is empty or just the scheme, return early
          if (!uri || uri === '') {
            console.log(
              'Empty URI received, this might be a basic URL scheme check',
            );
            return;
          }

          // If the URI is URL encoded, decode it
          try {
            uri = decodeURIComponent(uri);
            console.log('Decoded URI:', uri);
          } catch (e) {
            console.warn('Failed to decode URI, using as is:', e);
          }

          // If the URI doesn't start with wc:, try to extract it from the parameters
          if (!uri.startsWith('wc:')) {
            const urlParams = new URLSearchParams(uri);
            const wcUri = urlParams.get('uri');
            if (wcUri) {
              uri = wcUri;
              console.log('Extracted wc: URI from parameters:', uri);
            } else {
              console.log('No WalletConnect URI found in parameters');
              return;
            }
          }

          // Validate URI format
          if (!uri.startsWith('wc:')) {
            console.log(
              'Not a WalletConnect URI, might be a basic URL scheme check',
            );
            return;
          }

          // Parse and reconstruct the URI
          const [protocol, rest] = uri.split(':');
          const [projectId, versionAndParams] = rest.split('@');
          const [version, params] = versionAndParams.split('?');

          console.log('Parsed URI components:', {
            protocol,
            projectId,
            version,
            params,
          });

          // Create URLSearchParams from existing params
          const searchParams = new URLSearchParams(params);

          // Ensure required parameters
          if (!searchParams.has('relay-protocol')) {
            searchParams.set('relay-protocol', 'irn');
          }
          if (!searchParams.has('expiry')) {
            searchParams.set(
              'expiry',
              Math.floor(Date.now() / 1000 + 3600).toString(),
            );
          }

          // Reconstruct the URI
          const finalUri = `${protocol}:${projectId}@${version}?${searchParams.toString()}`;
          console.log('Final URI:', finalUri);

          if (walletKit) {
            await walletKit.pair({ uri: finalUri });
            console.log('Successfully paired with URI:', finalUri);
          } else {
            console.warn('WalletKit not initialized yet');
          }
        } catch (error) {
          console.error('Failed to handle deep link:', error);
          if (error instanceof Error) {
            console.error('Error details:', error.message);
          }
        }
      }
    };

    // 监听深度链接
    Linking.addEventListener('url', handleDeepLink);

    // 检查初始 URL
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      // 清理监听器
      Linking.removeAllListeners('url');
    };
  }, [walletKit, isInitialized]);

  const initWalletConnect = async () => {
    try {
      console.log('Initializing WalletConnect...');

      // Initialize Core with explicit configuration
      const core = new Core({
        projectId: 'da30bc4fca0acd4702dac317b0fd9f16',
        logger: 'debug',
      });

      console.log('Core initialized successfully');

      // Initialize WalletKit with explicit configuration
      const initWalletKit = await WalletKit.init({
        core,
        metadata: {
          name: 'Onegate',
          description: 'A Dapp store built on the 👉Neo blockchain.',
          url: 'https://walletconnect.com',
          icons: [
            'https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Icon/Blue%20(Default)/Icon.svg',
          ],
          redirect: {
            native: 'onegate://',
            universal: 'https://walletconnect.com',
          },
        },
      });

      console.log('WalletKit initialized successfully');

      // Set up event listeners
      initWalletKit.on('session_proposal', async proposal => {
        console.log(
          'Session proposal received:',
          JSON.stringify(proposal, null, 2),
        );
        try {
          const session = await initWalletKit.approveSession({
            id: proposal.id,
            namespaces: {
              eip155: {
                chains: ['eip155:1', 'eip155:137'],
                methods: ['eth_sendTransaction', 'personal_sign'],
                events: ['accountsChanged', 'chainChanged'],
                accounts: [
                  'eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',
                  'eip155:137:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',
                ],
              },
            },
          });
          console.log('Session approved:', JSON.stringify(session, null, 2));
        } catch (error) {
          console.error('Failed to approve session:', error);
        }
      });

      initWalletKit.on('session_error' as any, error => {
        console.error('Session error:', error);
      });

      setWalletKit(initWalletKit);
      return initWalletKit;
    } catch (error) {
      console.error('Failed to initialize WalletConnect:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View>
        <Text>ceshi</Text>
        <Text>ceshi</Text>
        <Text>ceshi</Text>
        <Text>ceshi</Text>
        <Text>ceshi00001</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
