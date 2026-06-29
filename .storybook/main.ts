import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
  viteFinal: async (cfg) => {
    // src/lib/supabase.ts throws at import time when these are missing, and the
    // contexts import it transitively. Stories mock the contexts, so a dummy
    // value just lets the client construct without ever making a network call.
    cfg.define = {
      ...cfg.define,
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
        process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
      ),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
        process.env.VITE_SUPABASE_ANON_KEY || 'storybook-dummy-anon-key',
      ),
      // Lets Stripe-wrapped components mount <Elements> without crashing.
      // A well-formed but fake test key — Stripe.js loads, API calls would fail.
      'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(
        process.env.VITE_STRIPE_PUBLISHABLE_KEY ||
          'pk_test_00000000000000000000000000',
      ),
    };
    return cfg;
  },
};

export default config;
