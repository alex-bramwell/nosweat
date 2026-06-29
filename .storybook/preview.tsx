import type { Preview } from '@storybook/react-vite';
import '../src/styles/globals.scss';
import { withTheme } from './decorators';

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    options: {
      storySort: {
        order: [
          'Common',
          'Sections',
          'Layout',
          'Coach',
          'Gym Admin',
          'Modals',
          '*',
        ],
      },
    },
  },
  // Theme switcher in the toolbar — swaps the injected white-label palette.
  globalTypes: {
    theme: {
      description: 'White-label theme palette',
      defaultValue: 'forge-dark',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'forge-dark', title: 'Forge (dark)' },
          { value: 'forge-light', title: 'Forge (light)' },
          { value: 'platform-dark', title: 'Platform (dark)' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme],
  tags: ['autodocs'],
};

export default preview;
